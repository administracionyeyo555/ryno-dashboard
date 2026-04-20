'use client'

import { motion } from 'framer-motion'
import {
  GripVertical,
  Calendar,
  User,
  MoreHorizontal,
  CheckCircle2,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskPriority } from '@/types/database'

interface TaskCardProps {
  task: Task
  index?: number
  onDragStart?: (e: React.DragEvent, task: Task) => void
  onDragEnd?: (e: React.DragEvent) => void
}

// Colores de prioridad segun requisitos:
// low=gris, medium=azul, high=naranja, critical=rojo
const priorityColors: Record<TaskPriority, { bg: string; text: string; border: string; dot: string }> = {
  low: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/20',
    dot: 'bg-gray-400',
  },
  medium: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400',
  },
  high: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    dot: 'bg-orange-400',
  },
  critical: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
  },
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
}

export function TaskCard({
  task,
  index = 0,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    })
  }

  const priority = priorityColors[task.priority]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      draggable
      onDragStart={(e) => onDragStart?.(e as unknown as React.DragEvent, task)}
      onDragEnd={(e) => onDragEnd?.(e as unknown as React.DragEvent)}
      className="kanban-card group"
    >
      {/* Drag handle */}
      <div className="flex items-start gap-2">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing pt-1">
          <GripVertical className="w-4 h-4 text-muted" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with priority badge and menu */}
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded border inline-flex items-center gap-1.5',
                priority.bg,
                priority.text,
                priority.border
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', priority.dot)} />
              {priorityLabels[task.priority]}
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded">
              <MoreHorizontal className="w-4 h-4 text-muted" />
            </button>
          </div>

          {/* Title */}
          <h4 className="font-medium text-foreground mb-2 line-clamp-2">
            {task.title}
          </h4>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-muted line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          {/* Project indicator with color */}
          {task.project && (
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.project.color }}
              />
              <span className="text-xs font-medium text-foreground/80 truncate">
                {task.project.name}
              </span>
            </div>
          )}

          {/* Si no hay proyecto en la relacion pero si project_slug */}
          {!task.project && task.project_slug && (
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-muted flex-shrink-0" />
              <span className="text-xs text-muted truncate">
                {task.project_slug}
              </span>
            </div>
          )}

          {/* Created by */}
          <div className="flex items-center gap-1.5 mb-2 text-xs text-muted">
            <UserCircle className="w-3.5 h-3.5" />
            <span>Creado por: <span className="text-foreground/80">{task.created_by || 'desconocido'}</span></span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {/* Assigned to */}
            {task.assigned_to ? (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="w-3 h-3 text-accent" />
                </div>
                <span className="text-xs text-muted">{task.assigned_to}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted">
                <User className="w-4 h-4 opacity-50" />
                <span className="text-xs">Sin asignar</span>
              </div>
            )}

            {/* Dates section */}
            <div className="flex flex-col items-end gap-0.5">
              {/* Fecha de creacion */}
              {task.created_at && (
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Calendar className="w-3 h-3" />
                  <span>{formatShortDate(task.created_at)}</span>
                </div>
              )}

              {/* Completed at if applicable */}
              {task.completed_at && (
                <div className="flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{formatShortDate(task.completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
