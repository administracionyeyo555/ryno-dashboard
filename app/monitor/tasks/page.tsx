'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare,
  Plus,
  Search,
  ClipboardList,
  Clock,
  Inbox,
  X,
  Loader2,
  FolderKanban,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react'
import { TaskCard } from '@/components/dashboard/TaskCard'
import { supabase } from '@/lib/supabase'
import { useDashboardStore } from '@/stores/dashboard-store'
import type { Task, TaskStatus, TaskPriority, ProjectDB } from '@/types/database'

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'pending', title: 'Por Hacer', color: '#888888' },
  { id: 'in_progress', title: 'En Progreso', color: '#FF6B35' },
  { id: 'done', title: 'Completado', color: '#22c55e' },
]

interface CreatedTaskInfo {
  title: string
  description: string | null
  projectName: string
  priority: TaskPriority
}

function generateClaudePrompt(task: CreatedTaskInfo): string {
  const priorityLabels: Record<TaskPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Critica'
  }

  return `Tarea: ${task.title}
Proyecto: ${task.projectName}
Prioridad: ${priorityLabels[task.priority]}

Descripcion:
${task.description || 'Sin descripcion adicional.'}

---
Cuando termines, marca la tarea como completada.`
}

function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  projects
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: Omit<Task, 'id' | 'created_at' | 'completed_at'>) => Promise<void>
  projects: ProjectDB[]
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectSlug, setProjectSlug] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdTask, setCreatedTask] = useState<CreatedTaskInfo | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    setError(null)

    const selectedProject = projects.find(p => p.slug === projectSlug) || projects[0]

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        project_slug: projectSlug || projects[0]?.slug || '',
        priority,
        status: 'pending',
        assigned_to: assignedTo.trim() || null,
        created_by: 'human',
      })

      setCreatedTask({
        title: title.trim(),
        description: description.trim() || null,
        projectName: selectedProject?.name || projectSlug || 'Sin proyecto',
        priority
      })
    } catch (err) {
      setError('Error al crear la tarea. Intenta de nuevo.')
      console.error('Error creating task:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyPrompt = async () => {
    if (!createdTask) return
    const prompt = generateClaudePrompt(createdTask)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const handleCreateAnother = () => {
    setCreatedTask(null)
    setTitle('')
    setDescription('')
    setProjectSlug('')
    setPriority('medium')
    setAssignedTo('')
    setCopied(false)
  }

  const handleClose = () => {
    setCreatedTask(null)
    setTitle('')
    setDescription('')
    setProjectSlug('')
    setPriority('medium')
    setAssignedTo('')
    setError(null)
    setCopied(false)
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setProjectSlug('')
      setPriority('medium')
      setAssignedTo('')
      setError(null)
      setCreatedTask(null)
      setCopied(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle para mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {createdTask ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Tarea Creada
              </h2>
              <button
                type="button"
                aria-label="Cerrar modal"
                onClick={handleClose}
                className="p-1 hover:bg-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                La tarea &ldquo;{createdTask.title}&rdquo; fue creada exitosamente.
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Prompt para Claude Code
                </label>
                <p className="text-xs text-muted mb-2">
                  Copia este prompt y pegalo en Claude Code:
                </p>
                <div className="relative">
                  <textarea
                    readOnly
                    aria-label="Prompt para Claude Code"
                    value={generateClaudePrompt(createdTask)}
                    className="input w-full resize-none font-mono text-sm bg-background"
                    rows={8}
                  />
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${
                      copied
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-background hover:bg-card text-muted hover:text-foreground'
                    }`}
                    title={copied ? 'Copiado!' : 'Copiar prompt'}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t border-border pb-safe">
                <button
                  type="button"
                  onClick={handleCreateAnother}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Crear Otra
                </button>
                <button type="button" onClick={handleClose} className="btn btn-primary">
                  Cerrar
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                Nueva Tarea
              </h2>
              <button
                type="button"
                aria-label="Cerrar modal"
                onClick={handleClose}
                className="p-1 hover:bg-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Titulo <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nombre de la tarea"
                  className="input w-full"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Descripcion
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripcion opcional"
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Proyecto
                </label>
                <select
                  aria-label="Seleccionar proyecto"
                  value={projectSlug}
                  onChange={(e) => setProjectSlug(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.slug}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Prioridad
                </label>
                <select
                  aria-label="Seleccionar prioridad"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="input w-full"
                >
                  <option value="low">Baja (Gris)</option>
                  <option value="medium">Media (Azul)</option>
                  <option value="high">Alta (Naranja)</option>
                  <option value="critical">Critica (Rojo)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Asignado a
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="claude-code, human, etc. (opcional)"
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border pb-safe">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !title.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Tarea
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

function EmptyTasksState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-8">
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/10"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 100, height: 100 }}
        />
        <div className="relative w-[100px] h-[100px] rounded-full bg-card border-2 border-border flex items-center justify-center">
          <ClipboardList className="w-10 h-10 text-muted" />
        </div>
      </div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-3 text-center"
      >
        Sin tareas
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted text-center max-w-sm mb-6 text-sm"
      >
        Crea una nueva tarea para organizar el trabajo.
        Las tareas se sincronizan con tus agentes.
      </motion.p>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="btn btn-primary"
        onClick={onCreateClick}
      >
        <Plus className="w-4 h-4 mr-2" />
        Crear Primera Tarea
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 text-xs text-muted/70 mt-8"
      >
        <Clock className="w-3 h-3" />
        <span>Las tareas se actualizan en tiempo real</span>
      </motion.div>
    </motion.div>
  )
}

function EmptyColumnState({ status }: { status: TaskStatus }) {
  const config = {
    pending: { message: 'Arrastra tareas aqui o crea una nueva', icon: Inbox },
    in_progress: { message: 'Arrastra tareas para iniciar', icon: Clock },
    done: { message: 'Las tareas completadas apareceran aqui', icon: CheckSquare },
  }
  const { message, icon: Icon } = config[status]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8 text-muted border-2 border-dashed border-border rounded-lg bg-background/20"
    >
      <Icon className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm text-center px-4">{message}</p>
    </motion.div>
  )
}

export default function TasksPage() {
  const { tasks, setTasks, updateTask, addTask } = useDashboardStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectDB[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  // Mobile: columna activa en la vista de tabs
  const [mobileActiveColumn, setMobileActiveColumn] = useState<TaskStatus>('pending')

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, project:projects!tasks_project_slug_fkey(*)')
        .order('created_at', { ascending: false })

      if (error) {
        const { data: tasksOnly, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
        if (!tasksError && tasksOnly) setTasks(tasksOnly as Task[])
      } else if (data) {
        setTasks(data as Task[])
      }
    } catch (err) {
      console.error('Unexpected error fetching tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [setTasks])

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('active', true)
        .order('name')
      if (!error && data) setProjects(data as ProjectDB[])
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [fetchTasks, fetchProjects])

  useEffect(() => {
    const subscription = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks()
      })
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [fetchTasks])

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = selectedProject === 'all' || task.project_slug === selectedProject
    return matchesSearch && matchesProject
  })

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((task) => task.status === status)

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTask(null)
    setDragOverColumn(null)
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, columnStatus: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnStatus)
  }

  const handleDragLeave = () => { setDragOverColumn(null) }

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    const oldStatus = draggedTask.status
    const taskId = draggedTask.id

    updateTask(taskId, {
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : (oldStatus === 'done' ? null : undefined)
    })

    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'done') updateData.completed_at = new Date().toISOString()
    else if (oldStatus === 'done') updateData.completed_at = null

    const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId)
    if (error) {
      console.error('Error updating task status:', error)
      updateTask(taskId, {
        status: oldStatus,
        completed_at: oldStatus === 'done' ? draggedTask.completed_at : null
      })
    }

    setDraggedTask(null)
  }

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'completed_at'>) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select('*, project:projects!tasks_project_slug_fkey(*)')
      .single()

    if (error) {
      const { data: taskOnly, error: taskError } = await supabase
        .from('tasks')
        .insert([taskData])
        .select('*')
        .single()
      if (taskError) throw taskError
      if (taskOnly) addTask(taskOnly as Task)
    } else if (data) {
      addTask(data as Task)
    }
  }

  const taskCounts = {
    pending: getTasksByStatus('pending').length,
    in_progress: getTasksByStatus('in_progress').length,
    done: getTasksByStatus('done').length,
  }

  const totalTasks = taskCounts.pending + taskCounts.in_progress + taskCounts.done

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <span>Cargando tareas...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="mb-5 md:mb-8">
        <div className="flex items-start justify-between mb-4 md:mb-6 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 md:gap-3">
              <FolderKanban className="w-6 h-6 md:w-8 md:h-8 text-accent flex-shrink-0" />
              <span>Kanban</span>
            </h1>
            <p className="text-muted mt-1 text-sm hidden md:block">
              Gestion de tareas en tiempo real
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary !px-3 md:!px-4 flex-shrink-0"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Nueva Tarea</span>
            <span className="sm:hidden ml-1 text-sm">Nueva</span>
          </button>
        </div>

        {/* Filters */}
        {tasks.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            <select
              aria-label="Filtrar por proyecto"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="all">Todos los proyectos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.slug}>
                  {project.name}
                </option>
              ))}
            </select>

            <span className="text-sm text-muted hidden sm:block ml-auto whitespace-nowrap">
              {totalTasks} tarea{totalTasks !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Empty State or Kanban Board */}
      {totalTasks === 0 && tasks.length === 0 ? (
        <EmptyTasksState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : (
        <>
          {/* ── MOBILE: Column tabs ── */}
          <div className="md:hidden mb-4">
            <div className="flex rounded-xl bg-background/50 p-1 gap-1">
              {columns.map((col) => {
                const isActive = mobileActiveColumn === col.id
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setMobileActiveColumn(col.id)}
                    className="relative flex-1 flex flex-col items-center py-2.5 px-1 rounded-lg transition-all"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobileKanbanTab"
                        className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span
                      className="relative z-10 text-[11px] font-semibold"
                      style={{ color: isActive ? col.color : undefined }}
                    >
                      {col.title}
                    </span>
                    <motion.span
                      key={taskCounts[col.id]}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="relative z-10 text-lg font-bold leading-tight"
                      style={{ color: isActive ? col.color : undefined }}
                    >
                      {taskCounts[col.id]}
                    </motion.span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── MOBILE: Single column view ── */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              {columns.map((column) => {
                if (column.id !== mobileActiveColumn) return null
                const columnTasks = getTasksByStatus(column.id)

                return (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {columnTasks.length === 0 ? (
                      <EmptyColumnState status={column.id} />
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {columnTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* ── DESKTOP: Full kanban 3-column ── */}
          <div className="hidden md:flex gap-6 overflow-x-auto pb-4">
            {columns.map((column, colIndex) => {
              const columnTasks = getTasksByStatus(column.id)
              const isDropTarget = dragOverColumn === column.id && draggedTask?.status !== column.id

              return (
                <motion.div
                  key={column.id}
                  className={`kanban-column transition-all duration-200 ${
                    isDropTarget ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIndex * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4 sticky top-0 bg-card/50 backdrop-blur-sm py-2 -mt-2 -mx-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                      <h3 className="font-semibold text-foreground">{column.title}</h3>
                      <motion.span
                        key={taskCounts[column.id]}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-0.5 text-xs font-medium bg-background rounded-full text-muted"
                      >
                        {taskCounts[column.id]}
                      </motion.span>
                    </div>
                  </div>

                  <div className="space-y-2 min-h-[200px]">
                    <AnimatePresence mode="popLayout">
                      {columnTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </AnimatePresence>

                    {columnTasks.length === 0 && (
                      <EmptyColumnState status={column.id} />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateTaskModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateTask}
            projects={projects}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
