import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Stale session threshold: 30 minutes
const STALE_THRESHOLD_MINUTES = 30

interface StaleSessionResult {
  sessionId: string
  lastEventAt: string | null
  sessionStartedAt: string
  minutesSinceActivity: number
}

/**
 * Cleanup stale agent sessions
 *
 * A session is considered stale if:
 * - Status is 'active', 'running', or 'idle'
 * - Last event timestamp (or session start if no events) is older than 30 minutes
 *
 * Stale sessions are marked as 'stopped' with ended_at set to current timestamp
 */
export async function POST() {
  try {
    const now = new Date()
    const thresholdTime = new Date(now.getTime() - STALE_THRESHOLD_MINUTES * 60 * 1000)

    // Step 1: Get all active sessions
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('agent_sessions')
      .select('id, started_at, status')
      .in('status', ['active', 'running', 'idle'])

    if (sessionsError) {
      console.error('[cleanup-sessions] Error fetching active sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch active sessions', details: sessionsError.message },
        { status: 500 }
      )
    }

    if (!activeSessions || activeSessions.length === 0) {
      return NextResponse.json({
        message: 'No active sessions found',
        cleaned: 0,
        checked: 0
      })
    }

    // Step 2: For each active session, get the latest event timestamp
    const sessionIds = activeSessions.map(s => s.id)

    // Get the most recent event for each session using a subquery approach
    const { data: latestEvents, error: eventsError } = await supabase
      .from('agent_events')
      .select('session_id, timestamp')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: false })

    if (eventsError) {
      console.error('[cleanup-sessions] Error fetching events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to fetch session events', details: eventsError.message },
        { status: 500 }
      )
    }

    // Build a map of session_id -> latest event timestamp
    const lastEventMap = new Map<string, string>()
    if (latestEvents) {
      for (const event of latestEvents) {
        // Only keep the first (most recent) event for each session
        if (!lastEventMap.has(event.session_id) && event.timestamp) {
          lastEventMap.set(event.session_id, event.timestamp)
        }
      }
    }

    // Step 3: Determine which sessions are stale
    const staleSessions: StaleSessionResult[] = []

    for (const session of activeSessions) {
      // Use the latest event time, or fall back to session start time
      const lastActivityTime = lastEventMap.get(session.id) || session.started_at
      const lastActivityDate = new Date(lastActivityTime)
      const minutesSinceActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60))

      if (lastActivityDate < thresholdTime) {
        staleSessions.push({
          sessionId: session.id,
          lastEventAt: lastEventMap.get(session.id) || null,
          sessionStartedAt: session.started_at,
          minutesSinceActivity
        })
      }
    }

    if (staleSessions.length === 0) {
      return NextResponse.json({
        message: 'No stale sessions found',
        cleaned: 0,
        checked: activeSessions.length,
        thresholdMinutes: STALE_THRESHOLD_MINUTES
      })
    }

    // Step 4: Update stale sessions to 'stopped'
    const staleIds = staleSessions.map(s => s.sessionId)
    const endedAt = now.toISOString()

    const { error: updateError, count: updatedCount } = await supabase
      .from('agent_sessions')
      .update({
        status: 'stopped',
        stopped_at: endedAt
      })
      .in('id', staleIds)
      .select('id')

    if (updateError) {
      console.error('[cleanup-sessions] Error updating stale sessions:', updateError)
      return NextResponse.json(
        { error: 'Failed to update stale sessions', details: updateError.message },
        { status: 500 }
      )
    }

    console.log(`[cleanup-sessions] Cleaned ${updatedCount} stale sessions:`, staleIds)

    return NextResponse.json({
      message: `Successfully cleaned ${updatedCount} stale sessions`,
      cleaned: updatedCount || staleSessions.length,
      checked: activeSessions.length,
      thresholdMinutes: STALE_THRESHOLD_MINUTES,
      cleanedSessions: staleSessions
    })

  } catch (error) {
    console.error('[cleanup-sessions] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Unexpected error during cleanup', details: String(error) },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing/debugging
export async function GET() {
  // Just return info about what this endpoint does
  return NextResponse.json({
    description: 'Cleanup stale agent sessions',
    method: 'POST to execute cleanup',
    thresholdMinutes: STALE_THRESHOLD_MINUTES,
    behavior: 'Sessions with status active/running/idle that have no events in the last 30 minutes will be marked as stopped'
  })
}
