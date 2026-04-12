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
  Loader2
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

// Modal para crear nueva tarea
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
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
      // Reset form
      setTitle('')
      setDescription('')
      setProjectSlug('')
      setPriority('medium')
      setAssignedTo('')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Nueva Tarea</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-background rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Titulo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Titulo *
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

          {/* Descripcion */}
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

          {/* Proyecto */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Proyecto
            </label>
            <select
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

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="input w-full"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Critica</option>
            </select>
          </div>

          {/* Asignado a */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Asignado a
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="claude-code, human, etc."
              className="input w-full"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
      </motion.div>
    </motion.div>
  )
}

// Componente de empty state mejorado
function EmptyTasksState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20"
    >
      {/* Icono animado */}
      <div className="relative mb-8">
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/10"
          animate={{
            scale: [1, 1.3, 1],
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
          <ClipboardList className="w-10 h-10 text-muted" />
        </div>
      </div>

      {/* Texto principal */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-3"
      >
        Sin tareas
      </motion.h3>

      {/* Subtexto */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted text-center max-w-md mb-6"
      >
        Crea una nueva tarea para empezar a organizar el trabajo de tus proyectos.
        Las tareas se sincronizan automaticamente con tus agentes.
      </motion.p>

      {/* Boton de accion */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="btn btn-primary"
        onClick={onCreateClick}
      >
        <Plus className="w-4 h-4 mr-2" />
        Crear Primera Tarea
      </motion.button>

      {/* Indicador */}
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

// Componente de empty state para columna individual
function EmptyColumnState({ status }: { status: TaskStatus }) {
  const messages = {
    pending: 'Arrastra tareas aqui',
    in_progress: 'Sin tareas en progreso',
    done: 'Sin tareas completadas',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8 text-muted border-2 border-dashed border-border rounded-lg"
    >
      <Inbox className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm">{messages[status]}</p>
    </motion.div>
  )
}

export default function TasksPage() {
  const { tasks, setTasks, updateTask, addTask } = useDashboardStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectDB[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, project:projects!tasks_project_slug_fkey(*)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tasks:', error)
        // Fallback: try without relation
        const { data: tasksOnly, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })

        if (!tasksError && tasksOnly) {
          setTasks(tasksOnly as Task[])
        }
      } else if (data) {
        setTasks(data as Task[])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [setTasks])

  // Fetch projects from Supabase
  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('active', true)
      .order('name')

    if (!error && data) {
      setProjects(data as ProjectDB[])
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [fetchTasks, fetchProjects])

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchTasks()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchTasks])

  // Filter tasks
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
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    const oldStatus = draggedTask.status

    // Update locally first for instant feedback
    updateTask(draggedTask.id, { status: newStatus })

    // Prepare update data
    const updateData: Record<string, unknown> = { status: newStatus }

    // If moving to done, set completed_at
    if (newStatus === 'done') {
      updateData.completed_at = new Date().toISOString()
    } else if (oldStatus === 'done') {
      // If moving out of done, clear completed_at
      updateData.completed_at = null
    }

    // Then update in database
    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', draggedTask.id)

    if (error) {
      console.error('Error updating task:', error)
      // Revert on error
      updateTask(draggedTask.id, { status: oldStatus })
    }

    setDraggedTask(null)
  }

  // Create new task
  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'completed_at'>) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select('*, project:projects!tasks_project_slug_fkey(*)')
      .single()

    if (error) {
      console.error('Error creating task:', error)
      // Try without relation
      const { data: taskOnly, error: taskError } = await supabase
        .from('tasks')
        .insert([taskData])
        .select('*')
        .single()

      if (!taskError && taskOnly) {
        addTask(taskOnly as Task)
      } else {
        throw taskError
      }
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
        <div className="flex items-center gap-3 text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando tareas...</span>
        </div>
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
              <CheckSquare className="w-8 h-8 text-accent" />
              Tareas
            </h1>
            <p className="text-muted mt-1">
              Kanban board para gestion de tareas
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Tarea
          </button>
        </div>

        {/* Filters */}
        {tasks.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            {/* Project filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input min-w-[200px]"
            >
              <option value="all">Todos los proyectos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.slug}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Empty State o Kanban Board */}
      {totalTasks === 0 && tasks.length === 0 ? (
        <EmptyTasksState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <motion.div
              key={column.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columns.indexOf(column) * 0.1 }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
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

              {/* Tasks */}
              <div className="space-y-2 min-h-[200px]">
                <AnimatePresence mode="popLayout">
                  {getTasksByStatus(column.id).map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onDragStart={handleDragStart}
                      onDragEnd={() => setDraggedTask(null)}
                    />
                  ))}
                </AnimatePresence>

                {getTasksByStatus(column.id).length === 0 && (
                  <EmptyColumnState status={column.id} />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
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
