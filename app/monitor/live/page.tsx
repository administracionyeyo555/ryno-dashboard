'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, RefreshCw, Search, Filter, Clock, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { SessionDetailModal } from '@/components/dashboard/SessionDetailModal'
import { useRealtimeAgents } from '@/hooks/useRealtimeAgents'
import { useProjects } from '@/hooks/useProjects'
import type { AgentSession } from '@/types/database'

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-8">
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 120, height: 120 }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/30"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          style={{ width: 120, height: 120 }}
        />
        <div className="relative w-[120px] h-[120px] rounded-full bg-card border-2 border-border flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
            <Loader2 className="w-12 h-12 text-accent" />
          </motion.div>
        </div>
      </div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-2xl font-semibold text-foreground mb-3 text-center"
      >
        Sin actividad reciente
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted text-center max-w-sm mb-6 text-sm md:text-base"
      >
        Los agentes apareceran aqui cuando empiecen a trabajar.
        Activa &quot;Demo&quot; para ver una preview.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 text-sm text-muted/70"
      >
        <Clock className="w-4 h-4" />
        <span>Actualizacion cada 5 segundos</span>
      </motion.div>

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
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
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
  const [selectedSession, setSelectedSession] = useState<AgentSession | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ryno-demo-mode')
    if (saved === 'true') setUseDemoData(true)
  }, [])

  const toggleDemoMode = () => {
    const newValue = !useDemoData
    setUseDemoData(newValue)
    localStorage.setItem('ryno-demo-mode', String(newValue))
  }

  const sessions = useDemoData ? [] : activeSessions

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.current_tool?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.current_file?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = !selectedProject || session.project_id === selectedProject
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
    setTimeout(() => setSelectedSession(null), 300)
  }

  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const runningCount = sessions.filter((s) => s.status === 'running' || s.status === 'active').length
  const idleCount = sessions.filter((s) => s.status === 'idle').length
  const showRealEmptyState = activeSessions.length === 0

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        {/* Title row */}
        <div className="flex items-start justify-between mb-4 md:mb-6 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 md:gap-3">
              <Activity className="w-6 h-6 md:w-8 md:h-8 text-accent flex-shrink-0" />
              <span>Agentes en Vivo</span>
            </h1>
            <p className="text-muted mt-1 text-sm hidden md:block">
              Monitoreo en tiempo real de agentes activos
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Demo toggle — compact on mobile */}
            <motion.button
              onClick={toggleDemoMode}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 px-2.5 py-2 md:px-4 md:py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                useDemoData
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-card border-border text-muted hover:border-accent/50'
              }`}
            >
              {useDemoData ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span className="hidden sm:inline font-medium">Demo {useDemoData ? 'ON' : 'OFF'}</span>
              <span className="sm:hidden font-medium text-xs">{useDemoData ? 'Demo' : 'Demo'}</span>
              {useDemoData && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse hidden sm:block"
                />
              )}
            </motion.button>

            <button
              type="button"
              onClick={handleRefresh}
              className="btn btn-secondary !px-2.5 md:!px-4"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Stats + filters — only when there's data */}
        {!showRealEmptyState && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4 md:mb-6">
              <motion.div
                className="card !p-3 md:!p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full bg-success"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <motion.p
                      key={runningCount}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl md:text-2xl font-bold text-foreground"
                    >
                      {runningCount}
                    </motion.p>
                    <p className="text-xs text-muted">Running</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="card !p-3 md:!p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                  </div>
                  <div>
                    <motion.p
                      key={idleCount}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl md:text-2xl font-bold text-foreground"
                    >
                      {idleCount}
                    </motion.p>
                    <p className="text-xs text-muted">Idle</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="card !p-3 md:!p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  </div>
                  <div>
                    <motion.p
                      key={sessions.length}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl md:text-2xl font-bold text-foreground"
                    >
                      {sessions.length}
                    </motion.p>
                    <p className="text-xs text-muted">Total</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar agentes, tools, archivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <select
                  aria-label="Filtrar por proyecto"
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value || null)}
                  className="input pl-10 pr-8 appearance-none cursor-pointer w-full sm:w-auto"
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

      {/* Content */}
      {showRealEmptyState ? (
        <EmptyState />
      ) : (
        <>
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
              <p className="text-sm">Intenta con otros filtros</p>
            </motion.div>
          )}
        </>
      )}

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
