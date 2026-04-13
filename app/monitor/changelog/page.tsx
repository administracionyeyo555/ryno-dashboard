'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  GitCommit,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Clock,
  User,
  FileCode,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface ChangelogEntry {
  id: string
  project_slug: string
  commit_hash: string | null
  message: string
  author: string | null
  files_changed: number | null
  lines_added: number | null
  lines_deleted: number | null
  timestamp: string
  created_at: string
}

interface ProjectDB {
  id: string
  name: string
  slug: string
  color: string
}

const springPhysics = {
  smooth: { type: 'spring' as const, stiffness: 200, damping: 20 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'hace un momento'
  if (diffMins < 60) return `hace ${diffMins} min`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

function ChangelogCard({
  entry,
  project,
  index,
}: {
  entry: ChangelogEntry
  project: ProjectDB | undefined
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ...springPhysics.smooth }}
      className="bg-card border border-border rounded-xl p-4 hover:border-accent/30 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        {/* Timeline dot */}
        <div className="flex flex-col items-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: project?.color ? `${project.color}20` : '#FF6B3520' }}
          >
            <GitCommit
              className="w-5 h-5"
              style={{ color: project?.color || '#FF6B35' }}
            />
          </div>
          <div className="w-0.5 flex-1 bg-border mt-2 group-last:hidden" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="font-medium text-foreground line-clamp-2">
                {entry.message}
              </p>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted">
                {project && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: `${project.color}20`,
                      color: project.color,
                    }}
                  >
                    {project.name}
                  </span>
                )}
                {entry.author && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {entry.author}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted shrink-0">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(entry.timestamp)}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            {entry.commit_hash && (
              <span className="font-mono text-accent">
                {entry.commit_hash.slice(0, 7)}
              </span>
            )}
            {entry.files_changed !== null && entry.files_changed > 0 && (
              <span className="flex items-center gap-1 text-muted">
                <FileCode className="w-3 h-3" />
                {entry.files_changed} archivo{entry.files_changed !== 1 ? 's' : ''}
              </span>
            )}
            {entry.lines_added !== null && entry.lines_added > 0 && (
              <span className="text-green-400">+{entry.lines_added}</span>
            )}
            {entry.lines_deleted !== null && entry.lines_deleted > 0 && (
              <span className="text-red-400">-{entry.lines_deleted}</span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" />
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="relative mb-8">
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: 100, height: 100 }}
        />
        <div className="relative w-[100px] h-[100px] rounded-full bg-card border-2 border-border flex items-center justify-center">
          <History className="w-10 h-10 text-muted" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        Sin cambios registrados
      </h3>
      <p className="text-muted text-center max-w-md">
        Los commits y cambios de tus proyectos apareceran aqui automaticamente
        cuando los agentes realicen modificaciones.
      </p>
    </motion.div>
  )
}

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [projects, setProjects] = useState<ProjectDB[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, slug, color')
        .eq('active', true)
        .order('name')

      if (projectsData) {
        setProjects(projectsData)
      }

      // Fetch changelog entries
      const { data: changelogData, error } = await supabase
        .from('project_changelog')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching changelog:', error)
      } else if (changelogData) {
        setEntries(changelogData)
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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.commit_hash?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProject =
      selectedProject === 'all' || entry.project_slug === selectedProject

    return matchesSearch && matchesProject
  })

  const projectMap = new Map(projects.map((p) => [p.slug, p]))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <span>Cargando historial de cambios...</span>
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
              <History className="w-8 h-8 text-accent" />
              Changelog
            </h1>
            <p className="text-muted mt-1">
              Historial de commits y cambios en todos los proyectos
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')}
            />
            Actualizar
          </button>
        </motion.div>

        {/* Filters */}
        {entries.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-4 items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Buscar commits, autores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="input pl-10 pr-8 appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="all">Todos los proyectos</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.slug}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-sm text-muted ml-auto">
              {filteredEntries.length} cambio{filteredEntries.length !== 1 ? 's' : ''}
            </span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry, index) => (
              <ChangelogCard
                key={entry.id}
                entry={entry}
                project={projectMap.get(entry.project_slug)}
                index={index}
              />
            ))}
          </AnimatePresence>

          {filteredEntries.length === 0 && entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-muted"
            >
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg">No se encontraron resultados</p>
              <p className="text-sm">Intenta con otros filtros de busqueda</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
