'use client'

import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useDashboardStore } from '@/stores/dashboard-store'
import type { AgentSession, AgentEvent } from '@/types/database'

export function useRealtimeAgents() {
  const {
    activeSessions,
    setActiveSessions,
    addSession,
    updateSession,
    removeSession,
    addEvent,
  } = useDashboardStore()

  const fetchActiveSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('agent_sessions')
      .select('*, project:projects(*)')
      .in('status', ['running', 'idle', 'active'])
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return
    }

    // If events_count is missing/null, fetch actual count from agent_events
    const sessionsWithCounts = await Promise.all(
      (data || []).map(async (session) => {
        if (session.events_count == null || session.events_count === 0) {
          const { count } = await supabase
            .from('agent_events')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)

          return {
            ...session,
            events_count: count || 0
          }
        }
        return session
      })
    )

    setActiveSessions(sessionsWithCounts as AgentSession[])
  }, [setActiveSessions])

  useEffect(() => {
    fetchActiveSessions()

    // Subscribe to session changes
    const sessionChannel = supabase
      .channel('agent_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_sessions',
        },
        (payload) => {
          const newSession = payload.new as AgentSession
          if (newSession.status === 'running' || newSession.status === 'idle' || newSession.status === 'active') {
            addSession(newSession)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agent_sessions',
        },
        (payload) => {
          const updatedSession = payload.new as AgentSession
          if (
            updatedSession.status === 'completed' ||
            updatedSession.status === 'error' ||
            updatedSession.status === 'stopped'
          ) {
            removeSession(updatedSession.id)
          } else {
            updateSession(updatedSession.id, updatedSession)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'agent_sessions',
        },
        (payload) => {
          const deletedSession = payload.old as AgentSession
          removeSession(deletedSession.id)
        }
      )
      .subscribe()

    // Subscribe to new events
    const eventChannel = supabase
      .channel('agent_events_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_events',
        },
        (payload) => {
          const newEvent = payload.new as AgentEvent
          addEvent(newEvent)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sessionChannel)
      supabase.removeChannel(eventChannel)
    }
  }, [
    fetchActiveSessions,
    addSession,
    updateSession,
    removeSession,
    addEvent,
  ])

  return {
    activeSessions,
    refetch: fetchActiveSessions,
  }
}
