'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  event_type: string // Mantener el tipo original de la BD
  original_event_type: string // Tipo original sin transformar
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

// Filtros para el hook
export interface EventFilters {
  projectSlug?: string | null
  eventType?: string | null
  dateFrom?: Date | null
  dateTo?: Date | null
  searchTerm?: string | null
}

// Mapear event_type de la BD a tipos del frontend (para compatibilidad)
function mapEventType(dbEventType: string): string {
  const typeMap: Record<string, string> = {
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
    'SessionStart': 'SessionStart',
    'Stop': 'Stop',
  }
  return typeMap[dbEventType] || dbEventType
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

  // Mensajes por tipo de evento
  const typeMessages: Record<string, string> = {
    'SessionStart': 'Sesion iniciada',
    'Stop': 'Sesion finalizada',
  }
  return typeMessages[event.event_type] || null
}

// Obtener tipos de eventos unicos de la BD
export function useEventTypes() {
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEventTypes() {
      try {
        const { data, error } = await supabase
          .from('agent_events')
          .select('event_type')

        if (error) {
          console.error('Error fetching event types:', error)
          return
        }

        // Obtener tipos unicos
        const typeSet = new Set<string>()
        data?.forEach(e => typeSet.add(e.event_type))
        const uniqueTypes = Array.from(typeSet).sort()
        setEventTypes(uniqueTypes)
      } catch (err) {
        console.error('Error in fetchEventTypes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEventTypes()
  }, [])

  return { eventTypes, loading }
}

export function useAgentEvents(
  limit: number = 50,
  filters: EventFilters = {}
) {
  const [events, setEvents] = useState<TransformedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const offsetRef = useRef(0)

  const fetchEvents = useCallback(async (reset: boolean = true) => {
    if (reset) {
      setLoading(true)
      offsetRef.current = 0
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      // Construir query base
      let query = supabase
        .from('agent_events')
        .select(`
          *,
          session:agent_sessions (
            *,
            project:projects (*)
          )
        `, { count: 'exact' })
        .order('timestamp', { ascending: false })

      // Aplicar filtros
      if (filters.searchTerm) {
        query = query.ilike('file_path', `%${filters.searchTerm}%`)
      }

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType)
      }

      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom.toISOString())
      }

      if (filters.dateTo) {
        // Ajustar dateTo al final del dia
        const endOfDay = new Date(filters.dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        query = query.lte('timestamp', endOfDay.toISOString())
      }

      // Paginacion
      const offset = reset ? 0 : offsetRef.current
      query = query.range(offset, offset + limit - 1)

      const { data: eventsData, error: eventsError, count } = await query

      if (eventsError) {
        console.error('Error fetching events:', eventsError)
        setError(eventsError.message)
        if (reset) setEvents([])
        setLoading(false)
        setLoadingMore(false)
        return
      }

      // Guardar total count
      if (count !== null) {
        setTotalCount(count)
      }

      if (!eventsData || eventsData.length === 0) {
        if (reset) setEvents([])
        setHasMore(false)
        setLastUpdate(new Date())
        setLoading(false)
        setLoadingMore(false)
        return
      }

      // Filtrar por proyecto si es necesario (ya que el filtro de proyecto es via join)
      let filteredEventsData = eventsData
      if (filters.projectSlug) {
        filteredEventsData = eventsData.filter((e) => {
          const session = e.session as DBAgentSessionWithProject | null
          return session?.project_slug === filters.projectSlug ||
                 session?.project?.slug === filters.projectSlug
        })
      }

      // Transformar datos
      const transformedEvents: TransformedEvent[] = filteredEventsData
        .filter((e) => e.timestamp) // Solo eventos con timestamp valido
        .map((e) => {
          const session = e.session as DBAgentSessionWithProject | null
          const project = session?.project

          return {
            id: e.id,
            session_id: e.session_id || '',
            project_id: project?.id || session?.project_slug || '',
            event_type: mapEventType(e.event_type),
            original_event_type: e.event_type,
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

      if (reset) {
        setEvents(transformedEvents)
        offsetRef.current = transformedEvents.length
      } else {
        setEvents(prev => [...prev, ...transformedEvents])
        offsetRef.current += transformedEvents.length
      }

      setHasMore(eventsData.length === limit)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error in fetchEvents:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      if (reset) setEvents([])
    }

    setLoading(false)
    setLoadingMore(false)
  }, [limit, filters.projectSlug, filters.eventType, filters.dateFrom, filters.dateTo, filters.searchTerm])

  // Cargar mas eventos (infinite scroll)
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchEvents(false)
    }
  }, [fetchEvents, loadingMore, hasMore])

  useEffect(() => {
    fetchEvents(true)

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
          fetchEvents(true)
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
    loadingMore,
    error,
    lastUpdate,
    hasMore,
    totalCount,
    refetch: () => fetchEvents(true),
    loadMore,
  }
}
