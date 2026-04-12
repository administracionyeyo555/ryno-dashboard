'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, RefreshCw, Search, Filter, Clock, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { useRealtimeAgents } from '@/hooks/useRealtimeAgents'
import { useProjects } from '@/hooks/useProjects'
import type { AgentSession } from '@/types/database'

// Demo data mejorado con animaciones de typing
const createDemoSessions = (): AgentSession[] => [
  {
    id: 'demo-1',
    project_id: 'caracas-golf-market',
    agent_name: 'Claude Golf Agent',
    status: 'running',
    current_tool: 'Edit',
    current_file: '/src/components/ScoreCard.tsx',
    started_at: new Date(Date.now() - 1800000).toISOString(),
    ended_at: null,
    duration_seconds: 1800,
    events_count: 45,
    isTyping: true,
    project: {
      id: 'caracas-golf-market',
      name: 'Caracas Golf Market',
      slug: 'caracas-golf-market',
      description: 'Marketplace de golf con tracking de estadisticas',
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
    id: 'demo-2',
    project_id: 'asotoy',
    agent_name: 'Claude ASOTOY Agent',
    status: 'running',
    current_tool: 'Write',
    current_file: '/app/api/checkout/route.ts',
    started_at: new Date(Date.now() - 900000).toISOString(),
    ended_at: null,
    duration_seconds: 900,
    events_count: 23,
    isTyping: true,
    project: {
      id: 'asotoy',
      name: 'ASOTOY',
      slug: 'asotoy',
      description: 'E-commerce platform',
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
    id: 'demo-3',
    project_id: 'dabi',
    agent_name: 'Claude Dabi Agent',
    status: 'running',
    current_tool: 'Bash',
    current_file: null,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    ended_at: null,
    duration_seconds: 3600,
    events_count: 67,
    isTyping: true,
    project: {
      id: 'dabi',
      name: 'Dabi App',
      slug: 'dabi-app',
      description: 'Mobile application',
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
]

// Demo events recientes
const demoRecentEvents = [
  { tool: 'Edit', file: 'ScoreCard.tsx', project: 'Golf', time: '2s' },
  { tool: 'Read', file: 'api/products.ts', project: 'ASOTOY', time: '5s' },
  { tool: 'Bash', file: 'npm install', project: 'Dabi', time: '8s' },
  { tool: 'Write', file: 'checkout/route.ts', project: 'ASOTOY', time: '12s' },
  { tool: 'Grep', file: 'src/**/*.tsx', project: 'Golf', time: '15s' },
]

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

// Componente de eventos recientes demo
function DemoRecentEvents() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card mt-6"
    >
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-accent" />
        Eventos Recientes (Demo)
      </h3>
      <div className="space-y-3">
        {demoRecentEvents.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className="tool-tag">{event.tool}</span>
              <span className="text-sm text-muted font-mono">{event.file}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">{event.project}</span>
              <span className="text-xs text-accent">{event.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
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
  const [demoSessions, setDemoSessions] = useState<AgentSession[]>([])

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

  // Crear datos demo con variaciones
  useEffect(() => {
    if (useDemoData) {
      setDemoSessions(createDemoSessions())

      // Simular cambios periodicos en los datos demo
      const interval = setInterval(() => {
        setDemoSessions(prev => prev.map(session => ({
          ...session,
          duration_seconds: session.duration_seconds + 1,
          events_count: session.events_count + (Math.random() > 0.7 ? 1 : 0),
          current_tool: ['Edit', 'Read', 'Write', 'Bash', 'Grep'][Math.floor(Math.random() * 5)],
        })))
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [useDemoData])

  // Determinar que sesiones mostrar
  const sessions = useDemoData ? demoSessions : activeSessions

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

  // Update duration every second for running sessions
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const runningCount = sessions.filter((s) => s.status === 'running').length
  const idleCount = sessions.filter((s) => s.status === 'idle').length

  // Determinar si mostrar estado vacio real
  const showRealEmptyState = !useDemoData && activeSessions.length === 0

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
            {/* Toggle para demo data - VISIBLE EN ESQUINA */}
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
                  isDemo={useDemoData}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Eventos recientes demo */}
          {useDemoData && <DemoRecentEvents />}

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
    </div>
  )
}
