'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Clock,
  FileCode,
  Wrench,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Terminal
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatDateTime, formatTime } from '@/lib/utils'
import type { AgentSession, AgentEvent } from '@/types/database'

interface SessionDetailModalProps {
  session: AgentSession
  isOpen: boolean
  onClose: () => void
}

// Icon mapping for event types
const eventTypeIcons: Record<string, React.ElementType> = {
  tool_use: Wrench,
  file_edit: FileCode,
  file_read: FileCode,
  error: AlertCircle,
  completion: CheckCircle,
  message: MessageSquare,
}

// Color mapping for event types
const eventTypeColors: Record<string, string> = {
  tool_use: 'text-accent bg-accent/10',
  file_edit: 'text-info bg-info/10',
  file_read: 'text-muted bg-muted/10',
  error: 'text-error bg-error/10',
  completion: 'text-success bg-success/10',
  message: 'text-warning bg-warning/10',
}

export function SessionDetailModal({ session, isOpen, onClose }: SessionDetailModalProps) {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('agent_events')
        .select('*')
        .eq('session_id', session.id)
        .order('timestamp', { ascending: false })

      if (fetchError) {
        console.error('Error fetching session events:', fetchError)
        setError(`Error al cargar los eventos: ${fetchError.message}`)
        setLoading(false)
        return
      }

      // Transform database fields to match component expectations
      const transformedEvents = (data || []).map(event => ({
        ...event,
        // Map 'timestamp' to 'created_at' for backward compatibility in display
        created_at: event.timestamp,
        // Map 'detail' to 'metadata' for backward compatibility
        metadata: event.detail,
        message: event.detail?.message || null,
      }))

      setEvents(transformedEvents as AgentEvent[])
    } catch (err) {
      console.error('Unexpected error fetching events:', err)
      setError('Error inesperado al cargar los eventos')
    } finally {
      setLoading(false)
    }
  }, [session.id])

  useEffect(() => {
    if (isOpen) {
      fetchEvents()
    }
  }, [isOpen, fetchEvents])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Calculate running time from started_at
  const calculateRunningTime = () => {
    if (!session.started_at) return 0
    const start = new Date(session.started_at).getTime()
    const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now()
    return Math.floor((end - start) / 1000)
  }

  const runningTime = calculateRunningTime()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: session.project?.color
                      ? `${session.project.color}20`
                      : 'rgba(255, 107, 53, 0.1)',
                  }}
                >
                  <Terminal
                    className="w-6 h-6"
                    style={{ color: session.project?.color || '#FF6B35' }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {session.agent_name}
                  </h2>
                  <p className="text-sm text-muted">
                    {session.project?.name || 'Proyecto desconocido'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted/10 transition-colors"
              >
                <X className="w-6 h-6 text-muted" />
              </button>
            </div>

            {/* Session Info Bar */}
            <div className="flex items-center gap-6 px-6 py-4 bg-background/50 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">
                  Tiempo: <strong>{formatTime(runningTime)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">
                  Eventos: <strong>{events.length}</strong>
                </span>
              </div>
              {session.current_tool && (
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-accent" />
                  <span className="text-sm text-foreground">
                    Tool actual: <strong className="tool-tag">{session.current_tool}</strong>
                  </span>
                </div>
              )}
              {session.current_file && (
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-muted" />
                  <span className="text-sm text-muted font-mono truncate max-w-[300px]">
                    {session.current_file}
                  </span>
                </div>
              )}
            </div>

            {/* Events Timeline */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
                  <p className="text-muted">Cargando eventos...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <AlertCircle className="w-8 h-8 text-error mb-4" />
                  <p className="text-error">{error}</p>
                  <button
                    onClick={fetchEvents}
                    className="mt-4 btn btn-secondary"
                  >
                    Reintentar
                  </button>
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Activity className="w-12 h-12 text-muted/50 mb-4" />
                  <p className="text-muted">No hay eventos registrados para esta sesion</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                  {/* Events */}
                  <div className="space-y-4">
                    {events.map((event, index) => {
                      const IconComponent = eventTypeIcons[event.event_type] || Activity
                      const colorClass = eventTypeColors[event.event_type] || 'text-muted bg-muted/10'

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="relative pl-14"
                        >
                          {/* Timeline dot */}
                          <div
                            className={cn(
                              'absolute left-4 w-5 h-5 rounded-full flex items-center justify-center',
                              colorClass
                            )}
                          >
                            <IconComponent className="w-3 h-3" />
                          </div>

                          {/* Event card */}
                          <div className="card !p-4 hover:border-accent/30 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted uppercase">
                                  {event.event_type.replace('_', ' ')}
                                </span>
                                {event.tool_name && (
                                  <span className="tool-tag text-xs">
                                    {event.tool_name}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted">
                                {formatDateTime(event.timestamp)}
                              </span>
                            </div>

                            {event.file_path && (
                              <div className="flex items-center gap-2 mb-2">
                                <FileCode className="w-4 h-4 text-muted" />
                                <span className="text-sm font-mono text-foreground truncate">
                                  {event.file_path}
                                </span>
                              </div>
                            )}

                            {event.message && (
                              <p className="text-sm text-muted line-clamp-2">
                                {event.message}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/50">
              <p className="text-sm text-muted">
                Sesion iniciada: {formatDateTime(session.started_at)}
              </p>
              <button onClick={onClose} className="btn btn-primary">
                Cerrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
