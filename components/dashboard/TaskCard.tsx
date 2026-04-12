'use client'

import { motion } from 'framer-motion'
import {
  GripVertical,
  Calendar,
  User,
  MoreHorizontal,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskPriority } from '@/types/database'

interface TaskCardProps {
  task: Task
  index?: number
  onDragStart?: (e: React.DragEvent, task: Task) => void
  onDragEnd?: () => void
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-info/10 text-info border-info/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-accent/10 text-accent border-accent/20',
  critical: 'bg-error/10 text-error border-error/20',
}

const priorityIcons: Record<TaskPriority, string> = {
  low: 'bg-info',
  medium: 'bg-warning',
  high: 'bg-accent',
  critical: 'bg-error',
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
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      draggable
      onDragStart={(e) => onDragStart?.(e as unknown as React.DragEvent, task)}
      onDragEnd={onDragEnd}
      className="kanban-card group"
    >
      {/* Drag handle */}
      <div className="flex items-start gap-2">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with priority and menu */}
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded border',
                priorityColors[task.priority]
              )}
            >
              <span className="flex items-center gap-1">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    priorityIcons[task.priority]
                  )}
                />
                {priorityLabels[task.priority]}
              </span>
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

          {/* Project indicator */}
          {task.project && (
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.project.color }}
              />
              <span className="text-xs text-muted">{task.project.name}</span>
            </div>
          )}

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

            {/* Completed at or created by */}
            {task.completed_at ? (
              <div className="flex items-center gap-1.5 text-xs text-success">
                <CheckCircle2 className="w-3 h-3" />
                <span>{formatDate(task.completed_at)}</span>
              </div>
            ) : task.created_at ? (
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.created_at)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
