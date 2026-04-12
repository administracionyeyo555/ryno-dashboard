'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Clock, Filter, RefreshCw, Search } from 'lucide-react'
import { EventTimeline } from '@/components/dashboard/EventTimeline'
import { supabase } from '@/lib/supabase'
import { useProjects } from '@/hooks/useProjects'
import { formatRelativeTime } from '@/lib/utils'
import type { AgentEvent } from '@/types/database'

// Demo events con timestamps dinamicos
const createDemoEvents = (): AgentEvent[] => [
  {
    id: '1',
    session_id: '1',
    project_id: 'caracas-golf-market',
    event_type: 'tool_use',
    tool_name: 'Edit',
    file_path: '/src/components/ScoreCard.tsx',
    message: 'Actualizando logica de calculo de puntuacion',
    metadata: { lines_changed: 15 },
    created_at: new Date(Date.now() - 60000).toISOString(), // hace 1 minuto
    project: {
      id: 'caracas-golf-market',
      name: 'Caracas Golf Market',
      slug: 'caracas-golf-market',
      description: null,
      color: '#2D5016',
      status: 'active',
      health_score: 85,
      total_sessions: 24,
      total_events: 1250,
      total_tasks: 12,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: '2',
    session_id: '1',
    project_id: 'caracas-golf-market',
    event_type: 'file_read',
    tool_name: 'Read',
    file_path: '/src/utils/calculations.ts',
    message: 'Leyendo utilidades de calculo',
    metadata: null,
    created_at: new Date(Date.now() - 120000).toISOString(), // hace 2 minutos
    project: {
      id: 'caracas-golf-market',
      name: 'Caracas Golf Market',
      slug: 'caracas-golf-market',
      description: null,
      color: '#2D5016',
      status: 'active',
      health_score: 85,
      total_sessions: 24,
      total_events: 1250,
      total_tasks: 12,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: '3',
    session_id: '2',
    project_id: 'asotoy',
    event_type: 'tool_use',
    tool_name: 'Bash',
    file_path: null,
    message: 'Ejecutando npm install para nuevas dependencias',
    metadata: { command: 'npm install stripe' },
    created_at: new Date(Date.now() - 300000).toISOString(), // hace 5 minutos
    project: {
      id: 'asotoy',
      name: 'ASOTOY',
      slug: 'asotoy',
      description: null,
      color: '#CC0000',
      status: 'active',
      health_score: 72,
      total_sessions: 18,
      total_events: 890,
      total_tasks: 8,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: '4',
    session_id: '2',
    project_id: 'asotoy',
    event_type: 'file_edit',
    tool_name: 'Write',
    file_path: '/app/api/checkout/route.ts',
    message: 'Creando endpoint de checkout',
    metadata: { lines_added: 45 },
    created_at: new Date(Date.now() - 600000).toISOString(), // hace 10 minutos
    project: {
      id: 'asotoy',
      name: 'ASOTOY',
      slug: 'asotoy',
      description: null,
      color: '#CC0000',
      status: 'active',
      health_score: 72,
      total_sessions: 18,
      total_events: 890,
      total_tasks: 8,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: '5',
    session_id: '3',
    project_id: 'dabi',
    event_type: 'error',
    tool_name: null,
    file_path: '/src/screens/Dashboard.tsx',
    message: 'Error de compilacion TypeScript: Property does not exist',
    metadata: { error_code: 'TS2339' },
    created_at: new Date(Date.now() - 1800000).toISOString(), // hace 30 minutos
    project: {
      id: 'dabi',
      name: 'Dabi',
      slug: 'dabi',
      description: null,
      color: '#7C3AED',
      status: 'active',
      health_score: 91,
      total_sessions: 32,
      total_events: 2100,
      total_tasks: 15,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: '6',
    session_id: '3',
    project_id: 'dabi',
    event_type: 'completion',
    tool_name: null,
    file_path: null,
    message: 'Tarea completada: Error de TypeScript corregido',
    metadata: { duration_seconds: 120 },
    created_at: new Date(Date.now() - 3600000).toISOString(), // hace 1 hora
    project: {
      id: 'dabi',
      name: 'Dabi',
      slug: 'dabi',
      description: null,
      color: '#7C3AED',
      status: 'active',
      health_score: 91,
      total_sessions: 32,
      total_events: 2100,
      total_tasks: 15,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: '7',
    session_id: '4',
    project_id: 'flowmando-platform',
    event_type: 'message',
    tool_name: null,
    file_path: null,
    message: 'Iniciando refactor del sistema de autenticacion',
    metadata: null,
    created_at: new Date(Date.now() - 7200000).toISOString(), // hace 2 horas
    project: {
      id: 'flowmando-platform',
      name: 'RYNO Studio',
      slug: 'flowmando-platform',
      description: null,
      color: '#FF6B35',
      status: 'active',
      health_score: 88,
      total_sessions: 45,
      total_events: 3200,
      total_tasks: 22,
      created_at: '',
      updated_at: '',
    },
  },
]

export default function HistoryPage() {
  const { projects } = useProjects()
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Actualizar timestamps cada minuto
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 60000) // Actualizar cada minuto
    return () => clearInterval(interval)
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('agent_events')
      .select('*, project:projects(*)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching events:', error)
      setEvents(createDemoEvents())
    } else {
      setEvents(data.length > 0 ? (data as AgentEvent[]) : createDemoEvents())
    }
    setLastUpdate(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.file_path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.tool_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProject =
      !selectedProject || event.project_id === selectedProject

    const matchesEventType =
      !selectedEventType || event.event_type === selectedEventType

    return matchesSearch && matchesProject && matchesEventType
  })

  const eventTypes = [
    { value: 'tool_use', label: 'Tool Use' },
    { value: 'file_edit', label: 'File Edit' },
    { value: 'file_read', label: 'File Read' },
    { value: 'error', label: 'Error' },
    { value: 'completion', label: 'Completion' },
    { value: 'message', label: 'Message' },
  ]

  const eventCounts = events.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Clock className="w-8 h-8 text-accent" />
              Historial de Eventos
            </h1>
            <p className="text-muted mt-1">
              Timeline de actividad de agentes
              <span className="mx-2">-</span>
              <span className="text-xs">
                Actualizado {formatRelativeTime(lastUpdate)}
              </span>
            </p>
          </div>
          <button
            onClick={fetchEvents}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {eventTypes.map((type) => (
            <button
              key={type.value}
              onClick={() =>
                setSelectedEventType(
                  selectedEventType === type.value ? null : type.value
                )
              }
              className={`card text-left transition-all ${
                selectedEventType === type.value
                  ? 'border-accent bg-accent/5'
                  : ''
              }`}
            >
              <p className="text-sm text-muted mb-1">{type.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {eventCounts[type.value] || 0}
              </p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Buscar en eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value || null)}
              className="input pl-10 pr-8 appearance-none cursor-pointer"
            >
              <option value="">Todos los proyectos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <EventTimeline events={filteredEvents} showProject />
        )}
      </motion.div>
    </div>
  )
}
