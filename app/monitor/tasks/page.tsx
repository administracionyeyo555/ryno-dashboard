'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Plus, Search, ClipboardList, Clock, Inbox } from 'lucide-react'
import { TaskCard } from '@/components/dashboard/TaskCard'
import { supabase } from '@/lib/supabase'
import { useDashboardStore } from '@/stores/dashboard-store'
import type { Task, TaskStatus } from '@/types/database'

// Demo tasks
const demoTasks: Task[] = [
  {
    id: '1',
    project_id: 'golf',
    title: 'Implementar sistema de handicap',
    description: 'Calcular y mostrar el handicap del jugador basado en sus ultimas rondas',
    status: 'todo',
    priority: 'high',
    assignee: 'Claude',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    project: {
      id: 'golf',
      name: 'Golf Shots',
      slug: 'golf-shots',
      description: null,
      color: '#22c55e',
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
    id: '2',
    project_id: 'asotoy',
    title: 'Integracion con Stripe',
    description: 'Configurar pagos con tarjeta de credito y debito',
    status: 'in_progress',
    priority: 'critical',
    assignee: 'Claude',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    project: {
      id: 'asotoy',
      name: 'ASOTOY',
      slug: 'asotoy',
      description: null,
      color: '#3b82f6',
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
    id: '3',
    project_id: 'dabi',
    title: 'Disenar pantalla de analytics',
    description: 'Crear visualizaciones de gastos mensuales',
    status: 'todo',
    priority: 'medium',
    assignee: null,
    due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    project: {
      id: 'dabi',
      name: 'Dabi App',
      slug: 'dabi-app',
      description: null,
      color: '#eab308',
      status: 'active',
      health_score: 91,
      total_sessions: 32,
      total_events: 2100,
      total_tasks: 15,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: '4',
    project_id: 'platform',
    title: 'Refactorizar sistema de auth',
    description: 'Migrar a NextAuth v5 con soporte para providers multiples',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Claude',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    project: {
      id: 'platform',
      name: 'Platform Core',
      slug: 'platform-core',
      description: null,
      color: '#FF6B35',
      status: 'active',
      health_score: 88,
      total_sessions: 45,
      total_events: 3200,
      total_tasks: 22,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: '5',
    project_id: 'golf',
    title: 'Agregar exportacion a PDF',
    description: 'Permitir exportar scorecard como PDF',
    status: 'done',
    priority: 'low',
    assignee: 'Claude',
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    project: {
      id: 'golf',
      name: 'Golf Shots',
      slug: 'golf-shots',
      description: null,
      color: '#22c55e',
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
    id: '6',
    project_id: 'asotoy',
    title: 'Optimizar imagenes de productos',
    description: 'Implementar lazy loading y formatos WebP',
    status: 'done',
    priority: 'medium',
    assignee: 'Claude',
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    project: {
      id: 'asotoy',
      name: 'ASOTOY',
      slug: 'asotoy',
      description: null,
      color: '#3b82f6',
      status: 'active',
      health_score: 72,
      total_sessions: 18,
      total_events: 890,
      total_tasks: 8,
      created_at: '',
      updated_at: '',
    },
  },
]

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'Por Hacer', color: '#888888' },
  { id: 'in_progress', title: 'En Progreso', color: '#FF6B35' },
  { id: 'done', title: 'Completado', color: '#22c55e' },
]

// Componente de empty state mejorado
function EmptyTasksState() {
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
        No hay tareas pendientes
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
    todo: 'Arrastra tareas aqui',
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
  const { tasks, setTasks, updateTask } = useDashboardStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [hasLoadedFromSupabase, setHasLoadedFromSupabase] = useState(false)

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, project:projects(*)')
      .order('priority', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      setTasks(demoTasks)
    } else {
      setTasks(data.length > 0 ? (data as Task[]) : demoTasks)
      setHasLoadedFromSupabase(data.length > 0)
    }
  }, [setTasks])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const displayTasks = tasks.length > 0 ? tasks : demoTasks

  const filteredTasks = displayTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

    // Update locally first for instant feedback
    updateTask(draggedTask.id, { status: newStatus })

    // Then update in database
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus } as Record<string, unknown>)
      .eq('id', draggedTask.id)

    if (error) {
      console.error('Error updating task:', error)
      // Revert on error
      updateTask(draggedTask.id, { status: draggedTask.status })
    }

    setDraggedTask(null)
  }

  const taskCounts = {
    todo: getTasksByStatus('todo').length,
    in_progress: getTasksByStatus('in_progress').length,
    done: getTasksByStatus('done').length,
  }

  const totalTasks = taskCounts.todo + taskCounts.in_progress + taskCounts.done
  const showEmptyState = totalTasks === 0 && !hasLoadedFromSupabase && tasks.length === 0

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
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Tarea
          </button>
        </div>

        {/* Search */}
        {!showEmptyState && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        )}
      </div>

      {/* Empty State o Kanban Board */}
      {showEmptyState ? (
        <EmptyTasksState />
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
    </div>
  )
}
