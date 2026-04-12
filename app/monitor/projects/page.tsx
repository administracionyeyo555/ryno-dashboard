'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Folder, Plus, Search, Activity, TrendingUp, GitCommit, FileCode, Code2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Tipo simplificado para la BD real
interface DBProject {
  id: string
  name: string
  slug: string
  color: string
  active: boolean
}

interface DBProjectStatus {
  project_slug: string
  health: string
  tasks_completed: number
  tasks_pending: number
}

// Tipo para metricas de git reales
interface GitMetrics {
  commits: number | null
  files: number | null
  lines: string | null
}

// Los 4 proyectos principales como fallback
const coreProjects: DBProject[] = [
  { id: '1', name: 'ASOTOY', slug: 'asotoy', color: '#CC0000', active: true },
  { id: '2', name: 'Caracas Golf Market', slug: 'caracas-golf-market', color: '#2D5016', active: true },
  { id: '3', name: 'DABI', slug: 'dabi', color: '#7C3AED', active: true },
  { id: '4', name: 'RYNO Studio', slug: 'flowmando-platform', color: '#FF6B35', active: true },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DBProject[]>(coreProjects)
  const [statusMap, setStatusMap] = useState<Record<string, DBProjectStatus>>({})
  const [gitMetrics, setGitMetrics] = useState<Record<string, GitMetrics>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name, slug, color, active')
          .order('name')

        if (projectsData && projectsData.length > 0) {
          setProjects(projectsData)
        }

        // Fetch status
        const { data: statusData } = await supabase
          .from('project_status')
          .select('project_slug, health, tasks_completed, tasks_pending')

        if (statusData) {
          const map: Record<string, DBProjectStatus> = {}
          statusData.forEach(s => {
            map[s.project_slug] = s
          })
          setStatusMap(map)
        }

        // Fetch git metrics from API
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
    }

    fetchData()
  }, [])

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular totales de metricas reales de git
  const totalCommits = Object.values(gitMetrics).reduce((acc, m) => acc + (m.commits || 0), 0)
  const totalFiles = Object.values(gitMetrics).reduce((acc, m) => acc + (m.files || 0), 0)

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
              Vista general de todos los proyectos activos
            </p>
          </div>
          <button className="px-4 py-2 bg-accent text-white rounded-lg flex items-center gap-2 hover:bg-accent/90 transition-colors">
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            <p className="text-sm text-muted mb-1">Activos</p>
            <p className="text-3xl font-bold text-green-400">{projects.filter(p => p.active).length}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project, index) => {
          const status = statusMap[project.slug]
          const metrics = gitMetrics[project.slug] || { commits: null, files: null, lines: null }
          const healthScore = status?.health === 'green' ? 100 : status?.health === 'yellow' ? 50 : 0

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
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
                    <p className="text-sm text-muted">{project.slug}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 text-xs rounded-full flex items-center gap-1",
                  project.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                )}>
                  <Activity className="w-3 h-3" />
                  {project.active ? 'active' : 'paused'}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 py-3 mb-3 bg-background/50 rounded-lg px-3">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{metrics.commits !== null ? metrics.commits : '-'}</p>
                    <p className="text-[10px] text-muted">commits</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{metrics.files !== null ? metrics.files : '-'}</p>
                    <p className="text-[10px] text-muted">archivos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{metrics.lines !== null ? metrics.lines : '-'}</p>
                    <p className="text-[10px] text-muted">lineas</p>
                  </div>
                </div>
              </div>

              {/* Tasks & Health */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>{status?.tasks_completed || 0} completadas</span>
                  <span>{status?.tasks_pending || 0} pendientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className={cn(
                    "w-4 h-4",
                    healthScore >= 80 ? "text-green-400" : healthScore >= 50 ? "text-yellow-400" : "text-gray-400"
                  )} />
                  <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: healthScore >= 80 ? '#22c55e' : healthScore >= 50 ? '#eab308' : '#6b7280',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${healthScore}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                  <span className="text-sm text-muted">
                    {healthScore > 0 ? `${healthScore}%` : '-'}
                  </span>
                </div>
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
          <p className="text-sm">Intenta con otro término de búsqueda</p>
        </motion.div>
      )}
    </div>
  )
}
