'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import {
  Folder, Plus, Search, TrendingUp, GitCommit, FileCode, Code2,
  GitBranch, Clock, FileWarning, Bot, CheckCircle2, Circle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import { SkeletonProjectCard } from '@/components/ui/Skeleton'
import {
  springPhysics,
  staggerContainerVariants,
  staggerItemVariants,
  progressBarSpring,
  animateNumber,
} from '@/lib/animations'

// Interfaces
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

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
function AnimatedCounter({
  value,
  className,
  duration = 1500
}: {
  value: number | string | null
  className?: string
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (typeof value === 'number' && !hasAnimated.current) {
      hasAnimated.current = true
      animateNumber(0, value, duration, setDisplayValue)
    }
  }, [value, duration])

  if (value === null) {
    return <span className={className}>-</span>
  }

  if (typeof value === 'string') {
    return <span className={className}>{value}</span>
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springPhysics.bouncy}
    >
      {displayValue}
    </motion.span>
  )
}

// ============================================
// HEALTH BADGE WITH BREATHING ANIMATION
// ============================================
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
    <motion.div
      className={cn('px-2 py-1 rounded-full flex items-center gap-1.5 text-xs', c.bg, c.text)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springPhysics.bouncy}
    >
      <motion.span
        className={cn('w-2 h-2 rounded-full', c.dot)}
        animate={status === 'green' ? {
          scale: [1, 1.02, 1],
          opacity: [0.7, 1, 0.7],
        } : undefined}
        transition={status === 'green' ? {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        } : undefined}
      />
      <span>{c.label}</span>
      {daysAgo !== null && <span className="opacity-70">({daysLabel})</span>}
    </motion.div>
  )
}

// ============================================
// PROJECT CARD WITH PARALLAX
// ============================================
function ProjectCard({
  project,
  metrics,
  index
}: {
  project: DBProject
  metrics: GitMetrics
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Mouse position for parallax
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth spring values
  const springConfig = { stiffness: 150, damping: 15 }
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    mouseX.set((e.clientX - centerX) / rect.width)
    mouseY.set((e.clientY - centerY) / rect.height)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ...springPhysics.smooth }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 20px 40px -10px ${project.color}30`,
      }}
      className="bg-card border border-border rounded-xl p-5 cursor-pointer relative overflow-hidden group"
    >
      {/* Animated color bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: project.color }}
        whileHover={{ height: 6 }}
        transition={springPhysics.snappy}
      />

      {/* Subtle glow on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none rounded-xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${project.color}10 0%, transparent 50%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pt-2 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${project.color}20` }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springPhysics.bouncy}
          >
            <Folder className="w-6 h-6" style={{ color: project.color }} />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">{project.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>{project.slug}</span>
              {metrics.currentBranch && (
                <motion.span
                  className="flex items-center gap-1 text-accent"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <GitBranch className="w-3 h-3" />
                  {metrics.currentBranch}
                </motion.span>
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
      <AnimatePresence>
        {metrics.lastCommit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 p-3 bg-background/50 rounded-lg border border-border/50 relative z-10"
          >
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

            {/* Files changed with stagger */}
            {metrics.lastCommit.files && metrics.lastCommit.files.length > 0 && (
              <motion.div
                className="space-y-1 pt-2 border-t border-border/30"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {metrics.lastCommit.files.slice(0, 4).map((file, idx) => (
                  <motion.div
                    key={idx}
                    variants={staggerItemVariants}
                    className="flex items-center justify-between text-xs"
                  >
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
                  </motion.div>
                ))}
                {metrics.lastCommit.files.length > 4 && (
                  <span className="text-xs text-muted">
                    +{metrics.lastCommit.files.length - 4} archivos mas
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Git Metrics Grid with animated counters */}
      <motion.div
        className="grid grid-cols-4 gap-2 py-3 mb-3 bg-background/50 rounded-lg px-3 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col items-center">
          <motion.div
            className="flex items-center gap-1 mb-1"
            whileHover={{ scale: 1.2 }}
          >
            <GitCommit className="w-4 h-4 text-accent" />
          </motion.div>
          <AnimatedCounter
            value={metrics.commits}
            className="text-lg font-bold text-foreground"
          />
          <p className="text-[10px] text-muted">commits</p>
        </div>
        <div className="flex flex-col items-center">
          <motion.div
            className="flex items-center gap-1 mb-1"
            whileHover={{ scale: 1.2 }}
          >
            <FileCode className="w-4 h-4 text-blue-400" />
          </motion.div>
          <AnimatedCounter
            value={metrics.files}
            className="text-lg font-bold text-foreground"
          />
          <p className="text-[10px] text-muted">archivos</p>
        </div>
        <div className="flex flex-col items-center">
          <motion.div
            className="flex items-center gap-1 mb-1"
            whileHover={{ scale: 1.2 }}
          >
            <Code2 className="w-4 h-4 text-green-400" />
          </motion.div>
          <AnimatedCounter
            value={metrics.lines}
            className="text-lg font-bold text-foreground"
          />
          <p className="text-[10px] text-muted">lineas</p>
        </div>
        <div className="flex flex-col items-center">
          <motion.div
            className="flex items-center gap-1 mb-1"
            whileHover={{ scale: 1.2 }}
          >
            <FileWarning className={cn(
              "w-4 h-4",
              metrics.uncommittedFiles && metrics.uncommittedFiles > 0 ? "text-orange-400" : "text-muted"
            )} />
          </motion.div>
          <AnimatedCounter
            value={metrics.uncommittedFiles}
            className={cn(
              "text-lg font-bold",
              metrics.uncommittedFiles && metrics.uncommittedFiles > 0 ? "text-orange-400" : "text-foreground"
            )}
          />
          <p className="text-[10px] text-muted">sin commit</p>
        </div>
      </motion.div>

      {/* Agent Session & Tasks */}
      <div className="flex items-center justify-between pt-4 border-t border-border relative z-10">
        <div className="flex items-center gap-4 text-sm">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <AnimatedCounter value={metrics.taskStats.completed} />
            </span>
            <span className="flex items-center gap-1 text-yellow-400">
              <Circle className="w-3.5 h-3.5" />
              <AnimatedCounter value={metrics.taskStats.pending} />
            </span>
          </motion.div>
        </div>

        {/* Agent Session */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
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
                  : "bg-muted/20 text-muted"
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
        </motion.div>
      </div>

      {/* Health Bar with spring animation */}
      <div className="mt-3 flex items-center gap-2 relative z-10">
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
            transition={progressBarSpring}
          />
        </div>
        <span className="text-sm text-muted w-10 text-right">
          {metrics.healthScore}%
        </span>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function ProjectsPage() {
  const [projects, setProjects] = useState<DBProject[]>(coreProjects)
  const [gitMetrics, setGitMetrics] = useState<Record<string, GitMetrics>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, slug, color, active')
        .order('name')

      if (projectsData && projectsData.length > 0) {
        setProjects(projectsData)
      }

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

  const totalCommits = Object.values(gitMetrics).reduce((acc, m) => acc + (m.commits || 0), 0)
  const totalFiles = Object.values(gitMetrics).reduce((acc, m) => acc + (m.files || 0), 0)
  const totalTasksCompleted = Object.values(gitMetrics).reduce((acc, m) => acc + (m.taskStats?.completed || 0), 0)
  const totalTasksPending = Object.values(gitMetrics).reduce((acc, m) => acc + (m.taskStats?.pending || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="mb-8">
          <div className="h-10 w-48 bg-border/50 rounded mb-2" />
          <div className="h-5 w-96 bg-border/30 rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 w-16 bg-border/50 rounded mb-2" />
              <div className="h-8 w-12 bg-border/30 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPhysics.smooth}
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={springPhysics.bouncy}
              >
                <Folder className="w-8 h-8 text-accent" />
              </motion.div>
              Proyectos
            </h1>
            <p className="text-muted mt-1">
              Vista general de todos los proyectos activos con metricas Git reales
            </p>
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg flex items-center gap-2 hover:bg-accent/90 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </motion.button>
        </motion.div>

        {/* Stats with stagger animation */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { label: 'Proyectos', value: projects.length, color: 'text-foreground' },
            { label: 'Commits (total)', value: totalCommits, color: 'text-accent' },
            { label: 'Archivos (total)', value: totalFiles, color: 'text-blue-400' },
            { label: 'Completadas', value: totalTasksCompleted, color: 'text-green-400', icon: CheckCircle2 },
            { label: 'Pendientes', value: totalTasksPending, color: 'text-yellow-400', icon: Circle },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={staggerItemVariants}
              className="bg-card border border-border rounded-xl p-4"
              whileHover={{ y: -2, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }}
            >
              <p className="text-sm text-muted mb-1 flex items-center gap-1">
                {stat.icon && <stat.icon className={`w-3 h-3 ${stat.color}`} />}
                {stat.label}
              </p>
              <AnimatedCounter
                value={stat.value > 0 ? stat.value : null}
                className={`text-3xl font-bold ${stat.color}`}
                duration={1500 + i * 200}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div
          className="relative max-w-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
        </motion.div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              metrics={gitMetrics[project.slug] || defaultMetrics}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-muted"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Folder className="w-16 h-16 mb-4 opacity-50" />
          </motion.div>
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
