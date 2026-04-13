'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AgentEvent, AgentSession, Project } from '@/types/database'

interface EventWithContext extends AgentEvent {
  session?: AgentSession & { project?: Project }
}

// Color mapping por proyecto
const getProjectColor = (projectName: string | undefined): string => {
  if (!projectName) return 'text-gray-400'

  const name = projectName.toLowerCase()

  if (name.includes('asotoy')) return 'text-red-400'
  if (name.includes('golf')) return 'text-green-400'
  if (name.includes('dabi')) return 'text-purple-400'
  if (name.includes('cerebro')) return 'text-blue-400'

  return 'text-gray-400'
}

// Formatear timestamp a HH:MM:SS
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

// Formatear el evento para mostrar en la terminal
const formatEventMessage = (event: EventWithContext): string => {
  const toolName = event.tool_name || event.event_type
  const filePath = event.file_path
    ? event.file_path.split(/[/\\]/).slice(-2).join('/') // Solo ultimos 2 segmentos
    : ''

  switch (event.event_type) {
    case 'tool_use':
      return toolName + (filePath ? ' ' + filePath : '')
    case 'file_edit':
      return 'Write ' + filePath
    case 'file_read':
      return 'Read ' + filePath
    case 'error':
      return 'ERROR: ' + (event.message || 'Unknown error')
    case 'completion':
      return 'Completed task'
    case 'message':
      return event.message || 'Message'
    default:
      return toolName + (filePath ? ' ' + filePath : '')
  }
}

export function EventFeed() {
  const [events, setEvents] = useState<EventWithContext[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch inicial de los ultimos 20 eventos
  useEffect(() => {
    const fetchRecentEvents = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('agent_events')
          .select(`
            *,
            session:agent_sessions(
              *,
              project:projects(*)
            )
          `)
          .order('timestamp', { ascending: false })
          .limit(20)

        if (error) {
          console.error('[EventFeed] Error fetching events:', error)
          return
        }

        // Revertir para mostrar los mas antiguos primero (scroll hacia abajo = mas reciente)
        setEvents((data || []).reverse() as EventWithContext[])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentEvents()
  }, [])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('event_feed_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_events',
        },
        async (payload) => {
          const newEvent = payload.new as AgentEvent

          // Fetch session and project info for the new event
          const { data: sessionData } = await supabase
            .from('agent_sessions')
            .select('*, project:projects(*)')
            .eq('id', newEvent.session_id)
            .single()

          const eventWithContext: EventWithContext = {
            ...newEvent,
            session: sessionData || undefined,
          }

          setEvents((prev) => {
            const updated = [...prev, eventWithContext]
            // Mantener solo los ultimos 20
            return updated.slice(-20)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Auto-scroll al fondo cuando llegan eventos nuevos
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [events])

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Event Feed</h2>
        <span className="text-xs text-muted ml-2">
          (ultimos 20 eventos de todos los agentes)
        </span>
      </div>

      {/* Terminal container */}
      <div
        ref={scrollRef}
        className="bg-[#0a0a0a] border border-border/50 rounded-lg p-4 h-[300px] overflow-y-auto font-mono text-sm"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#333 #0a0a0a'
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Cargando eventos...
            </motion.span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted">
            <span>No hay eventos recientes. Los eventos apareceran aqui en tiempo real.</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {events.map((event) => {
              const projectName = event.session?.project?.name
              const projectSlug = event.session?.project?.slug || projectName
              const agentName = event.session?.agent_name || 'unknown'
              const colorClass = getProjectColor(projectName || projectSlug)

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="py-1 leading-relaxed"
                >
                  <span className="text-gray-500">[{formatTime(event.timestamp)}]</span>
                  {' '}
                  <span className={colorClass}>
                    [{(projectSlug || 'UNKNOWN').toUpperCase()}]
                  </span>
                  {' '}
                  <span className="text-gray-300">{agentName}</span>
                  {' '}
                  <span className="text-gray-500">→</span>
                  {' '}
                  <span className="text-white">{formatEventMessage(event)}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}

        {/* Elemento invisible para auto-scroll */}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
