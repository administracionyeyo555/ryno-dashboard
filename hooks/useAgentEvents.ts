'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Tipo real de la BD
interface DBAgentEvent {
  id: string
  session_id: string | null
  event_type: string
  tool_name: string | null
  file_path: string | null
  detail: Record<string, unknown> | null
  timestamp: string | null
}

interface DBAgentSession {
  id: string
  project_slug: string | null
  agent_name: string
  status: string | null
  started_at: string | null
  stopped_at: string | null
  summary: string | null
  files_touched: string[] | null
}

// Tipo de sesion con proyecto anidado (resultado de Supabase join)
interface DBAgentSessionWithProject extends DBAgentSession {
  project: DBProject | null
}

interface DBProject {
  id: string
  name: string
  slug: string
  color: string
  repo_path: string | null
  active: boolean
  created_at: string
}

// Tipo transformado para el frontend
export interface TransformedEvent {
  id: string
  session_id: string
  project_id: string
  event_type: 'tool_use' | 'file_edit' | 'file_read' | 'error' | 'completion' | 'message'
  tool_name: string | null
  file_path: string | null
  message: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  project?: {
    id: string
    name: string
    slug: string
    description: string | null
    color: string
    status: 'active' | 'paused' | 'completed' | 'error'
    health_score: number
    total_sessions: number
    total_events: number
    total_tasks: number
    created_at: string
    updated_at: string
  }
}

// Mapear event_type de la BD a tipos del frontend
function mapEventType(dbEventType: string): TransformedEvent['event_type'] {
  const typeMap: Record<string, TransformedEvent['event_type']> = {
    'PostToolUse': 'tool_use',
    'PreToolUse': 'tool_use',
    'ToolUse': 'tool_use',
    'tool_use': 'tool_use',
    'FileEdit': 'file_edit',
    'file_edit': 'file_edit',
    'FileRead': 'file_read',
    'file_read': 'file_read',
    'Error': 'error',
    'error': 'error',
    'Completion': 'completion',
    'completion': 'completion',
    'Message': 'message',
    'message': 'message',
  }
  return typeMap[dbEventType] || 'message'
}

// Generar mensaje a partir del evento
function generateMessage(event: DBAgentEvent): string | null {
  if (event.detail && typeof event.detail === 'object') {
    // Intentar extraer mensaje del detail
    if ('message' in event.detail && typeof event.detail.message === 'string') {
      return event.detail.message
    }
    if ('command' in event.detail && typeof event.detail.command === 'string') {
      return `Ejecutando: ${event.detail.command}`
    }
    if ('change' in event.detail && typeof event.detail.change === 'string') {
      return event.detail.change
    }
    if ('error' in event.detail && typeof event.detail.error === 'string') {
      return event.detail.error
    }
  }

  // Generar mensaje por defecto basado en tipo y herramienta
  if (event.tool_name) {
    const toolMessages: Record<string, string> = {
      'Edit': `Editando ${event.file_path || 'archivo'}`,
      'Write': `Escribiendo ${event.file_path || 'archivo'}`,
      'Read': `Leyendo ${event.file_path || 'archivo'}`,
      'Bash': 'Ejecutando comando',
      'Glob': 'Buscando archivos',
      'Grep': 'Buscando en contenido',
    }
    return toolMessages[event.tool_name] || `Usando ${event.tool_name}`
  }

  return null
}

export function useAgentEvents(limit: number = 100) {
  const [events, setEvents] = useState<TransformedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Obtener eventos con sesiones y proyectos
      const { data: eventsData, error: eventsError } = await supabase
        .from('agent_events')
        .select(`
          *,
          session:agent_sessions (
            *,
            project:projects (*)
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (eventsError) {
        console.error('Error fetching events:', eventsError)
        setError(eventsError.message)
        setEvents([])
        setLoading(false)
        return
      }

      if (!eventsData || eventsData.length === 0) {
        setEvents([])
        setLastUpdate(new Date())
        setLoading(false)
        return
      }

      // Transformar datos
      const transformedEvents: TransformedEvent[] = eventsData
        .filter((e) => e.timestamp) // Solo eventos con timestamp valido
        .map((e) => {
          const session = e.session as DBAgentSessionWithProject | null
          const project = session?.project

          return {
            id: e.id,
            session_id: e.session_id || '',
            project_id: project?.id || session?.project_slug || '',
            event_type: mapEventType(e.event_type),
            tool_name: e.tool_name,
            file_path: e.file_path,
            message: generateMessage(e as DBAgentEvent),
            metadata: e.detail,
            created_at: e.timestamp,
            project: project ? {
              id: project.id,
              name: project.name,
              slug: project.slug,
              description: null,
              color: project.color,
              status: project.active ? 'active' as const : 'paused' as const,
              health_score: 100,
              total_sessions: 0,
              total_events: 0,
              total_tasks: 0,
              created_at: project.created_at,
              updated_at: project.created_at,
            } : undefined,
          }
        })

      setEvents(transformedEvents)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error in fetchEvents:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setEvents([])
    }

    setLoading(false)
  }, [limit])

  useEffect(() => {
    fetchEvents()

    // Suscribirse a nuevos eventos
    const channel = supabase
      .channel('agent_events_history')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_events',
        },
        () => {
          // Refetch para obtener el evento con su sesion y proyecto
          fetchEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEvents])

  return {
    events,
    loading,
    error,
    lastUpdate,
    refetch: fetchEvents,
  }
}
