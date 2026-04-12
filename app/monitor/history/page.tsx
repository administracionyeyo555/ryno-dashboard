'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Filter,
  RefreshCw,
  Search,
  AlertTriangle,
  Calendar,
  X,
  ChevronDown,
  Activity
} from 'lucide-react'
import { EventTimeline } from '@/components/dashboard/EventTimeline'
import { useProjects } from '@/hooks/useProjects'
import { useAgentEvents, useEventTypes, EventFilters } from '@/hooks/useAgentEvents'
import { formatRelativeTime } from '@/lib/utils'

export default function HistoryPage() {
  const { projects } = useProjects()
  const { eventTypes: availableEventTypes } = useEventTypes()

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // Construir objeto de filtros
  const filters: EventFilters = useMemo(() => ({
    projectSlug: selectedProject || undefined,
    eventType: selectedEventType || undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    searchTerm: searchTerm || undefined,
  }), [selectedProject, selectedEventType, dateFrom, dateTo, searchTerm])

  // Hook con filtros
  const {
    events,
    loading,
    loadingMore,
    error,
    lastUpdate,
    hasMore,
    totalCount,
    refetch,
    loadMore
  } = useAgentEvents(50, filters)

  // Actualizar timestamps cada minuto
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Contar eventos por tipo (de los eventos cargados)
  const eventCounts = useMemo(() => {
    return events.reduce((acc, event) => {
      const type = event.original_event_type || event.event_type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [events])

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedProject(null)
    setSelectedEventType(null)
    setDateFrom('')
    setDateTo('')
  }

  // Verificar si hay filtros activos
  const hasActiveFilters = searchTerm || selectedProject || selectedEventType || dateFrom || dateTo

  // Labels para tipos de eventos
  const eventTypeLabels: Record<string, string> = {
    'SessionStart': 'Sesion Iniciada',
    'PostToolUse': 'Post Tool Use',
    'PreToolUse': 'Pre Tool Use',
    'Stop': 'Sesion Detenida',
    'tool_use': 'Tool Use',
    'file_edit': 'Archivo Editado',
    'file_read': 'Archivo Leido',
    'error': 'Error',
    'completion': 'Completado',
    'message': 'Mensaje',
  }

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
              Timeline real de actividad de agentes desde Supabase
              <span className="mx-2">-</span>
              <span className="text-xs">
                Actualizado {formatRelativeTime(lastUpdate)}
              </span>
              {totalCount > 0 && (
                <>
                  <span className="mx-2">-</span>
                  <span className="text-xs text-accent">
                    {totalCount} eventos totales
                  </span>
                </>
              )}
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

        {/* Stats - Tipos de eventos disponibles */}
        {availableEventTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {availableEventTypes.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setSelectedEventType(
                    selectedEventType === type ? null : type
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedEventType === type
                    ? 'bg-accent text-white'
                    : 'bg-card border border-border hover:border-accent/50'
                }`}
              >
                <Activity className="w-3 h-3" />
                {eventTypeLabels[type] || type}
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  selectedEventType === type
                    ? 'bg-white/20'
                    : 'bg-muted/20'
                }`}>
                  {eventCounts[type] || 0}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busqueda por archivo */}
            <div className="relative">
              <label className="text-xs text-muted block mb-1.5">
                Buscar por archivo
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Nombre de archivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            {/* Filtro por proyecto */}
            <div className="relative">
              <label className="text-xs text-muted block mb-1.5">
                Proyecto
              </label>
              <div className="relative">
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value || null)}
                  className="input pr-8 appearance-none cursor-pointer w-full"
                >
                  <option value="">Todos los proyectos</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.slug}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>

            {/* Filtro por tipo de evento */}
            <div className="relative">
              <label className="text-xs text-muted block mb-1.5">
                Tipo de Evento
              </label>
              <div className="relative">
                <select
                  value={selectedEventType || ''}
                  onChange={(e) => setSelectedEventType(e.target.value || null)}
                  className="input pr-8 appearance-none cursor-pointer w-full"
                >
                  <option value="">Todos los tipos</option>
                  {availableEventTypes.map((type) => (
                    <option key={type} value={type}>
                      {eventTypeLabels[type] || type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>

            {/* Filtro por rango de fechas */}
            <div className="space-y-2">
              <label className="text-xs text-muted block mb-1.5">
                Rango de Fechas
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="input pl-10 w-full text-sm"
                    placeholder="Desde"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="input pl-10 w-full text-sm"
                    placeholder="Hasta"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Indicador de filtros activos */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <span className="text-xs text-muted">Filtros activos:</span>
              {searchTerm && (
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full flex items-center gap-1">
                  Archivo: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="hover:text-accent/80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedProject && (
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full flex items-center gap-1">
                  Proyecto: {projects.find(p => p.slug === selectedProject)?.name || selectedProject}
                  <button onClick={() => setSelectedProject(null)} className="hover:text-accent/80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedEventType && (
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full flex items-center gap-1">
                  Tipo: {eventTypeLabels[selectedEventType] || selectedEventType}
                  <button onClick={() => setSelectedEventType(null)} className="hover:text-accent/80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(dateFrom || dateTo) && (
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full flex items-center gap-1">
                  Fechas: {dateFrom || '...'} - {dateTo || '...'}
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="hover:text-accent/80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        {loading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-accent animate-spin mb-4" />
            <p className="text-sm text-muted">Cargando eventos de Supabase...</p>
          </div>
        ) : (
          <EventTimeline
            events={events}
            showProject
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        )}
      </motion.div>
    </div>
  )
}
