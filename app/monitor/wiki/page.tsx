'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  User,
  ChevronRight,
  Loader2,
  Plus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface WikiEntry {
  id: string
  project_slug: string
  title: string
  content: string
  category: string | null
  author: string | null
  created_at: string
  updated_at: string
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

function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function WikiCard({
  entry,
  project,
  index,
}: {
  entry: WikiEntry
  project: ProjectDB | undefined
  index: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ...springPhysics.smooth }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-accent/30 transition-all duration-300"
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: project?.color ? `${project.color}20` : '#FF6B3520',
              }}
            >
              <FileText
                className="w-5 h-5"
                style={{ color: project?.color || '#FF6B35' }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{entry.title}</h3>
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
                {entry.category && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent">
                    {entry.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-muted">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(entry.updated_at)}
              </div>
              {entry.author && (
                <div className="flex items-center gap-1 mt-1">
                  <User className="w-3 h-3" />
                  {entry.author}
                </div>
              )}
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-5 h-5 text-muted" />
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-border">
              <div className="prose prose-invert prose-sm max-w-none">
                <div
                  className="text-muted whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          <BookOpen className="w-10 h-10 text-muted" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        Wiki vacia
      </h3>
      <p className="text-muted text-center max-w-md mb-6">
        La documentacion de tus proyectos aparecera aqui.
        Los agentes pueden crear entradas automaticamente durante su trabajo.
      </p>
      <button className="btn btn-primary">
        <Plus className="w-4 h-4 mr-2" />
        Crear Primera Entrada
      </button>
    </motion.div>
  )
}

export default function WikiPage() {
  const [entries, setEntries] = useState<WikiEntry[]>([])
  const [projects, setProjects] = useState<ProjectDB[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
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

      // Fetch wiki entries
      const { data: wikiData, error } = await supabase
        .from('project_wiki')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching wiki:', error)
      } else if (wikiData) {
        setEntries(wikiData)
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

  const categories = Array.from(
    new Set(entries.map((e) => e.category).filter(Boolean))
  ) as string[]

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.author?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProject =
      selectedProject === 'all' || entry.project_slug === selectedProject

    const matchesCategory =
      selectedCategory === 'all' || entry.category === selectedCategory

    return matchesSearch && matchesProject && matchesCategory
  })

  const projectMap = new Map(projects.map((p) => [p.slug, p]))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <span>Cargando wiki...</span>
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
              <BookOpen className="w-8 h-8 text-accent" />
              Wiki
            </h1>
            <p className="text-muted mt-1">
              Documentacion y notas de todos los proyectos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Entrada
            </button>
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
          </div>
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
                placeholder="Buscar en la wiki..."
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
                className="input pl-10 pr-8 appearance-none cursor-pointer min-w-[180px]"
              >
                <option value="all">Todos los proyectos</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.slug}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input pr-8 appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="all">Todas las categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            <span className="text-sm text-muted ml-auto">
              {filteredEntries.length} entrada{filteredEntries.length !== 1 ? 's' : ''}
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
              <WikiCard
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
