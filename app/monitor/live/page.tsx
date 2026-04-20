'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, RefreshCw, Search, Filter, Clock, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { SessionDetailModal } from '@/components/dashboard/SessionDetailModal'
import { useRealtimeAgents } from '@/hooks/useRealtimeAgents'
import { useProjects } from '@/hooks/useProjects'
import type { AgentSession } from '@/types/database'

// Componente de estado vacio mejorado
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24"
    >
      {/* Icono animado de espera */}
      <div className="relative mb-8">
        {/* Circulo exterior con pulso */}
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: 120, height: 120 }}
        />
        {/* Circulo medio con pulso desfasado */}
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/30"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
          style={{ width: 120, height: 120 }}
        />
        {/* Contenedor del icono */}
        <div className="relative w-[120px] h-[120px] rounded-full bg-card border-2 border-border flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Loader2 className="w-12 h-12 text-accent" />
          </motion.div>
        </div>
      </div>

      {/* Texto principal */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-semibold text-foreground mb-3"
      >
        Sin actividad reciente
      </motion.h3>

      {/* Subtexto */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted text-center max-w-md mb-6"
      >
        Los agentes apareceran aqui cuando empiecen a trabajar.
        <br />
        Activa &quot;Datos Demo&quot; para ver una preview del dashboard.
      </motion.p>

      {/* Indicador de tiempo de espera */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 text-sm text-muted/70"
      >
        <Clock className="w-4 h-4" />
        <span>Actualizacion automatica cada 5 segundos</span>
      </motion.div>

      {/* Dots animados */}
      <motion.div
        className="flex gap-2 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-accent"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}

export default function LivePage() {
  const { activeSessions, refetch } = useRealtimeAgents()
  const { projects } = useProjects()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [useDemoData, setUseDemoData] = useState(false)

  // Modal state
  const [selectedSession, setSelectedSession] = useState<AgentSession | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Cargar preferencia de localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ryno-demo-mode')
    if (saved === 'true') {
      setUseDemoData(true)
    }
  }, [])

  // Guardar preferencia en localStorage
  const toggleDemoMode = () => {
    const newValue = !useDemoData
    setUseDemoData(newValue)
    localStorage.setItem('ryno-demo-mode', String(newValue))
  }

  // Determinar que sesiones mostrar (solo datos reales, no demo)
  const sessions = useDemoData ? [] : activeSessions

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.current_tool?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.current_file?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProject =
      !selectedProject || session.project_id === selectedProject

    return matchesSearch && matchesProject
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleCardClick = (session: AgentSession) => {
    setSelectedSession(session)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Delay clearing session to allow exit animation
    setTimeout(() => setSelectedSession(null), 300)
  }

  // Update duration every second for running sessions
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const runningCount = sessions.filter((s) => s.status === 'running' || s.status === 'active').length
  const idleCount = sessions.filter((s) => s.status === 'idle').length

  // Determinar si mostrar estado vacio real
  const showRealEmptyState = activeSessions.length === 0

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Activity className="w-8 h-8 text-accent" />
              Agentes en Vivo
            </h1>
            <p className="text-muted mt-1">
              Monitoreo en tiempo real de agentes activos
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle para demo data - Solo para mensaje informativo */}
            <motion.button
              onClick={toggleDemoMode}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                useDemoData
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-card border-border text-muted hover:border-accent/50'
              }`}
            >
              {useDemoData ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
              <span className="font-medium">
                Datos Demo {useDemoData ? 'ON' : 'OFF'}
              </span>
              {useDemoData && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-accent animate-pulse"
                />
              )}
            </motion.button>

            <button
              onClick={handleRefresh}
              className="btn btn-secondary"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats - Solo mostrar si hay datos */}
        {!showRealEmptyState && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <motion.div
                      className="w-3 h-3 rounded-full bg-success"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <motion.p
                      key={runningCount}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-bold text-foreground"
                    >
                      {runningCount}
                    </motion.p>
                    <p className="text-sm text-muted">Running</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                  </div>
                  <div>
                    <motion.p
                      key={idleCount}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-bold text-foreground"
                    >
                      {idleCount}
                    </motion.p>
                    <p className="text-sm text-muted">Idle</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <motion.p
                      key={sessions.length}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-bold text-foreground"
                    >
                      {sessions.length}
                    </motion.p>
                    <p className="text-sm text-muted">Total Active</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar agentes, tools, archivos..."
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
          </>
        )}
      </div>

      {/* Contenido principal */}
      {showRealEmptyState ? (
        <EmptyState />
      ) : (
        <>
          {/* Agent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredSessions.map((session, index) => (
                <AgentCard
                  key={session.id}
                  session={session}
                  index={index}
                  isDemo={false}
                  onClick={() => handleCardClick(session)}
                />
              ))}
            </AnimatePresence>
          </div>

          {filteredSessions.length === 0 && sessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-muted"
            >
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No se encontraron agentes</p>
              <p className="text-sm">Intenta con otros filtros de busqueda</p>
            </motion.div>
          )}
        </>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
