'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Folder, Plus, Search, TrendingUp, GitCommit, FileCode, Code2,
  GitBranch, Clock, FileWarning, Bot, CheckCircle2, Circle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'

// Tipo simplificado para la BD real
interface DBProject {
  id: string
  name: string
  slug: string
  color: string
  active: boolean
}

interface CommitFile {
  path: string
  added: number
  deleted: number
}

interface LastCommit {
  message: string
  timeAgo: string
  timestamp: Date | null
  author?: string
  files?: CommitFile[]
}

interface AgentSession {
  id: string
  started_at: string
  status: string
}

interface TaskStats {
  completed: number
  pending: number
}

type HealthStatus = 'green' | 'yellow' | 'red'

// Tipo para metricas de git reales (expandido)
interface GitMetrics {
  commits: number | null
  files: number | null
  lines: string | null
  lastCommit: LastCommit | null
  currentBranch: string | null
  uncommittedFiles: number | null
  lastAgentSession: AgentSession | null
  taskStats: TaskStats
  healthStatus: HealthStatus
  healthScore: number
  lastActivityDaysAgo: number | null
}

// Los 4 proyectos principales como fallback
const coreProjects: DBProject[] = [
  { id: '1', name: 'ASOTOY', slug: 'asotoy', color: '#CC0000', active: true },
  { id: '2', name: 'Caracas Golf Market', slug: 'caracas-golf-market', color: '#2D5016', active: true },
  { id: '3', name: 'DABI', slug: 'dabi', color: '#7C3AED', active: true },
  { id: '4', name: 'RYNO Studio', slug: 'flowmando-platform', color: '#FF6B35', active: true },
]

const defaultMetrics: GitMetrics = {
  commits: null,
  files: null,
  lines: null,
  lastCommit: null,
  currentBranch: null,
  uncommittedFiles: null,
  lastAgentSession: null,
  taskStats: { completed: 0, pending: 0 },
  healthStatus: 'red',
  healthScore: 0,
  lastActivityDaysAgo: null
}

function HealthBadge({ status, daysAgo }: { status: HealthStatus; daysAgo: number | null }) {
  const config = {
    green: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      label: 'Activo',
      dot: 'bg-green-400'
    },
    yellow: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      label: 'Moderado',
      dot: 'bg-yellow-400'
    },
    red: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      label: 'Inactivo',
      dot: 'bg-red-400'
    }
  }

  const c = config[status]
  const daysLabel = daysAgo !== null
    ? daysAgo === 0 ? 'hoy' : daysAgo === 1 ? 'ayer' : `${daysAgo}d`
    : '-'

  return (
    <div className={cn('px-2 py-1 rounded-full flex items-center gap-1.5 text-xs', c.bg, c.text)}>
      <span className={cn('w-2 h-2 rounded-full animate-pulse', c.dot)} />
      <span>{c.label}</span>
      {daysAgo !== null && <span className="opacity-70">({daysLabel})</span>}
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DBProject[]>(coreProjects)
  const [gitMetrics, setGitMetrics] = useState<Record<string, GitMetrics>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, slug, color, active')
        .order('name')

      if (projectsData && projectsData.length > 0) {
        setProjects(projectsData)
      }

      // Fetch git metrics from API (ahora incluye datos de Supabase)
      try {
        const res = await fetch('/api/git-metrics')
        if (res.ok) {
          const metricsData = await res.json()
          setGitMetrics(metricsData)
        }
      } catch (gitErr) {
        console.error('Error fetching git metrics:', gitErr)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular totales de metricas reales de git
  const totalCommits = Object.values(gitMetrics).reduce((acc, m) => acc + (m.commits || 0), 0)
  const totalFiles = Object.values(gitMetrics).reduce((acc, m) => acc + (m.files || 0), 0)
  const totalTasksCompleted = Object.values(gitMetrics).reduce((acc, m) => acc + (m.taskStats?.completed || 0), 0)
  const totalTasksPending = Object.values(gitMetrics).reduce((acc, m) => acc + (m.taskStats?.pending || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Folder className="w-8 h-8 text-accent" />
              Proyectos
            </h1>
            <p className="text-muted mt-1">
              Vista general de todos los proyectos activos con metricas Git reales
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg flex items-center gap-2 hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <motion.div
            className="bg-card border border-border rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-muted mb-1">Proyectos</p>
            <p className="text-3xl font-bold text-foreground">{projects.length}</p>
          </motion.div>
          <motion.div
            className="bg-card border border-border rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-sm text-muted mb-1">Commits (total)</p>
            <p className="text-3xl font-bold text-accent">{totalCommits > 0 ? totalCommits : '-'}</p>
          </motion.div>
          <motion.div
            className="bg-card border border-border rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-muted mb-1">Archivos (total)</p>
            <p className="text-3xl font-bold text-blue-400">{totalFiles > 0 ? totalFiles : '-'}</p>
          </motion.div>
          <motion.div
            className="bg-card border border-border rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-muted mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              Completadas
            </p>
            <p className="text-3xl font-bold text-green-400">{totalTasksCompleted}</p>
          </motion.div>
          <motion.div
            className="bg-card border border-border rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-muted mb-1 flex items-center gap-1">
              <Circle className="w-3 h-3 text-yellow-400" />
              Pendientes
            </p>
            <p className="text-3xl font-bold text-yellow-400">{totalTasksPending}</p>
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project, index) => {
          const metrics = gitMetrics[project.slug] || defaultMetrics

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="bg-card border border-border rounded-xl p-5 cursor-pointer relative overflow-hidden group"
            >
              {/* Color bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 group-hover:h-1.5 transition-all"
                style={{ backgroundColor: project.color }}
              />

              {/* Header */}
              <div className="flex items-start justify-between mb-4 pt-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <Folder className="w-6 h-6" style={{ color: project.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{project.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span>{project.slug}</span>
                      {metrics.currentBranch && (
                        <span className="flex items-center gap-1 text-accent">
                          <GitBranch className="w-3 h-3" />
                          {metrics.currentBranch}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <HealthBadge
                  status={metrics.healthStatus}
                  daysAgo={metrics.lastActivityDaysAgo}
                />
              </div>

              {/* Last Commit */}
              {metrics.lastCommit && (
                <div className="mb-4 p-3 bg-background/50 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted mb-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>Ultimo commit: {metrics.lastCommit.timeAgo}</span>
                    </div>
                    {metrics.lastCommit.author && (
                      <span className="text-accent">{metrics.lastCommit.author}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground mb-2" title={metrics.lastCommit.message}>
                    {metrics.lastCommit.message}
                  </p>
                  {/* Files changed */}
                  {metrics.lastCommit.files && metrics.lastCommit.files.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-border/30">
                      {metrics.lastCommit.files.slice(0, 4).map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-muted font-mono truncate max-w-[200px]" title={file.path}>
                            {file.path.split('/').pop()}
                          </span>
                          <div className="flex items-center gap-2">
                            {file.added > 0 && (
                              <span className="text-green-400">+{file.added}</span>
                            )}
                            {file.deleted > 0 && (
                              <span className="text-red-400">-{file.deleted}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {metrics.lastCommit.files.length > 4 && (
                        <span className="text-xs text-muted">
                          +{metrics.lastCommit.files.length - 4} archivos mas
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Git Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 py-3 mb-3 bg-background/50 rounded-lg px-3">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 mb-1">
                    <GitCommit className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{metrics.commits !== null ? metrics.commits : '-'}</p>
                  <p className="text-[10px] text-muted">commits</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 mb-1">
                    <FileCode className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{metrics.files !== null ? metrics.files : '-'}</p>
                  <p className="text-[10px] text-muted">archivos</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 mb-1">
                    <Code2 className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{metrics.lines !== null ? metrics.lines : '-'}</p>
                  <p className="text-[10px] text-muted">lineas</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 mb-1">
                    <FileWarning className={cn(
                      "w-4 h-4",
                      metrics.uncommittedFiles && metrics.uncommittedFiles > 0 ? "text-orange-400" : "text-muted"
                    )} />
                  </div>
                  <p className={cn(
                    "text-lg font-bold",
                    metrics.uncommittedFiles && metrics.uncommittedFiles > 0 ? "text-orange-400" : "text-foreground"
                  )}>
                    {metrics.uncommittedFiles !== null ? metrics.uncommittedFiles : '-'}
                  </p>
                  <p className="text-[10px] text-muted">sin commit</p>
                </div>
              </div>

              {/* Agent Session & Tasks */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4 text-sm">
                  {/* Tasks */}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {metrics.taskStats.completed}
                    </span>
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Circle className="w-3.5 h-3.5" />
                      {metrics.taskStats.pending}
                    </span>
                  </div>
                </div>

                {/* Agent Session */}
                <div className="flex items-center gap-2">
                  {metrics.lastAgentSession ? (
                    <div className="flex items-center gap-2 text-xs">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <span className="text-muted">
                        Sesion: {new Date(metrics.lastAgentSession.started_at).toLocaleDateString('es', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px]",
                        metrics.lastAgentSession.status === 'active'
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      )}>
                        {metrics.lastAgentSession.status}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Bot className="w-4 h-4" />
                      Sin sesiones
                    </span>
                  )}
                </div>
              </div>

              {/* Health Bar */}
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className={cn(
                  "w-4 h-4",
                  metrics.healthStatus === 'green' ? "text-green-400" :
                  metrics.healthStatus === 'yellow' ? "text-yellow-400" : "text-red-400"
                )} />
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        metrics.healthStatus === 'green' ? '#22c55e' :
                        metrics.healthStatus === 'yellow' ? '#eab308' : '#ef4444',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.healthScore}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                </div>
                <span className="text-sm text-muted w-10 text-right">
                  {metrics.healthScore}%
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-muted"
        >
          <Folder className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">No se encontraron proyectos</p>
          <p className="text-sm">Intenta con otro termino de busqueda</p>
        </motion.div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}
