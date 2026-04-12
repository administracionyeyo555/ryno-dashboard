'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Filter, RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { EventTimeline } from '@/components/dashboard/EventTimeline'
import { useProjects } from '@/hooks/useProjects'
import { useAgentEvents } from '@/hooks/useAgentEvents'
import { formatRelativeTime } from '@/lib/utils'

export default function HistoryPage() {
  const { projects } = useProjects()
  const { events, loading, error, lastUpdate, refetch } = useAgentEvents(100)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)

  // Actualizar timestamps cada minuto
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 60000) // Actualizar cada minuto
    return () => clearInterval(interval)
  }, [])

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.file_path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.tool_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProject =
      !selectedProject || event.project_id === selectedProject || event.project?.slug === selectedProject

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

  // Castear a AgentEvent para EventTimeline (compatible con la interfaz)
  const timelineEvents = filteredEvents as unknown as import('@/types/database').AgentEvent[]

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
            onClick={refetch}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-error" />
            <p className="text-sm text-error">Error al cargar eventos: {error}</p>
          </motion.div>
        )}

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
                <option key={project.id} value={project.slug}>
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
          <EventTimeline events={timelineEvents} showProject />
        )}
      </motion.div>
    </div>
  )
}
