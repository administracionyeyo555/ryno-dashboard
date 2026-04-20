'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface GlobalMetrics {
  sessionsToday: number
  filesModifiedToday: number
  mostActiveAgent: {
    name: string
    eventCount: number
  } | null
  lastEventTime: string | null
}

export function useGlobalMetrics() {
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    sessionsToday: 0,
    filesModifiedToday: 0,
    mostActiveAgent: null,
    lastEventTime: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastEventTimeRef = useRef<string | null>(null)

  // Get today's date at midnight in ISO format
  const getTodayStart = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.toISOString()
  }, [])

  const fetchMetrics = useCallback(async () => {
    try {
      const todayStart = getTodayStart()

      // Fetch all metrics in parallel
      const [
        sessionsResult,
        filesResult,
        agentEventsResult,
        lastEventResult
      ] = await Promise.all([
        // 1. Total sessions today
        supabase
          .from('agent_sessions')
          .select('id', { count: 'exact', head: true })
          .gte('started_at', todayStart),

        // 2. Distinct files modified today
        supabase
          .from('agent_events')
          .select('file_path')
          .gte('timestamp', todayStart)
          .not('file_path', 'is', null),

        // 3. Agent events today for most active calculation
        supabase
          .from('agent_events')
          .select(`
            session_id,
            session:agent_sessions (
              agent_name
            )
          `)
          .gte('timestamp', todayStart),

        // 4. Last event timestamp
        supabase
          .from('agent_events')
          .select('timestamp')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()
      ])

      // Handle sessions count
      const sessionsToday = sessionsResult.count || 0

      // Handle unique files count
      let filesModifiedToday = 0
      if (filesResult.data) {
        const uniqueFiles = new Set(
          filesResult.data
            .filter(e => e.file_path)
            .map(e => e.file_path)
        )
        filesModifiedToday = uniqueFiles.size
      }

      // Calculate most active agent
      let mostActiveAgent: GlobalMetrics['mostActiveAgent'] = null
      if (agentEventsResult.data && agentEventsResult.data.length > 0) {
        const agentCounts: Record<string, number> = {}

        agentEventsResult.data.forEach((event) => {
          // Type assertion for the nested session object
          // Supabase returns the related record as object or array depending on relation
          const sessionData = event.session as unknown
          let agentName: string | undefined

          if (Array.isArray(sessionData) && sessionData.length > 0) {
            agentName = (sessionData[0] as { agent_name?: string })?.agent_name
          } else if (sessionData && typeof sessionData === 'object') {
            agentName = (sessionData as { agent_name?: string })?.agent_name
          }

          if (agentName) {
            agentCounts[agentName] = (agentCounts[agentName] || 0) + 1
          }
        })

        const sortedAgents = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])
        if (sortedAgents.length > 0) {
          mostActiveAgent = {
            name: sortedAgents[0][0],
            eventCount: sortedAgents[0][1]
          }
        }
      }

      // Handle last event time
      const lastEventTime = lastEventResult.data?.timestamp || null
      lastEventTimeRef.current = lastEventTime

      setMetrics({
        sessionsToday,
        filesModifiedToday,
        mostActiveAgent,
        lastEventTime,
      })
      setError(null)
    } catch (err) {
      console.error('Error fetching global metrics:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [getTodayStart])

  useEffect(() => {
    fetchMetrics()

    // Subscribe to new sessions
    const sessionsChannel = supabase
      .channel('global_metrics_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_sessions',
        },
        () => {
          fetchMetrics()
        }
      )
      .subscribe()

    // Subscribe to new events
    const eventsChannel = supabase
      .channel('global_metrics_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_events',
        },
        (payload) => {
          // Update last event time immediately for responsiveness
          const newEvent = payload.new as { timestamp: string }
          if (newEvent.timestamp) {
            lastEventTimeRef.current = newEvent.timestamp
            setMetrics(prev => ({
              ...prev,
              lastEventTime: newEvent.timestamp
            }))
          }
          // Then fetch all metrics
          fetchMetrics()
        }
      )
      .subscribe()

    // Update last event relative time every 30 seconds
    const timeUpdateInterval = setInterval(() => {
      if (lastEventTimeRef.current) {
        setMetrics(prev => ({
          ...prev,
          lastEventTime: lastEventTimeRef.current
        }))
      }
    }, 30000)

    return () => {
      supabase.removeChannel(sessionsChannel)
      supabase.removeChannel(eventsChannel)
      clearInterval(timeUpdateInterval)
    }
  }, [fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  }
}
