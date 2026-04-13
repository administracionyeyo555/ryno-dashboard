'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GripVertical,
  Calendar,
  User,
  MoreHorizontal,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskPriority } from '@/types/database'
import {
  springPhysics,
  checkmarkVariants,
} from '@/lib/animations'

interface TaskCardProps {
  task: Task
  index?: number
  onDragStart?: (e: React.DragEvent, task: Task) => void
  onDragEnd?: (e: React.DragEvent) => void
}

// Priority colors
const priorityColors: Record<TaskPriority, { bg: string; text: string; border: string; dot: string }> = {
  low: {
    bg: 'bg-muted/10',
    text: 'text-muted',
    border: 'border-muted/20',
    dot: 'bg-muted',
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

// Animated checkmark SVG
function AnimatedCheckmark({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          className="text-success"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.path
            d="M5 12l5 5L20 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={checkmarkVariants}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  )
}

export function TaskCard({
  task,
  index = 0,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    })
  }

  const priority = priorityColors[task.priority]
  const isCompleted = task.status === 'done'

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    onDragStart?.(e, task)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    onDragEnd?.(e)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging
          ? '0 20px 40px rgba(255, 107, 53, 0.3)'
          : isHovered
          ? '0 10px 30px rgba(0, 0, 0, 0.2)'
          : '0 4px 20px rgba(0, 0, 0, 0.1)',
      }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{
        layout: springPhysics.smooth,
        opacity: { duration: 0.2, delay: index * 0.05 },
        scale: springPhysics.snappy,
      }}
      draggable
      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent)}
      onDragEnd={(e) => handleDragEnd(e as unknown as React.DragEvent)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'kanban-card group relative',
        isDragging && 'cursor-grabbing ring-2 ring-accent z-50',
        isCompleted && 'opacity-80'
      )}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Drag handle with animation */}
      <div className="flex items-start gap-2">
        <motion.div
          className="pt-1"
          animate={{
            opacity: isHovered || isDragging ? 1 : 0,
            x: isHovered || isDragging ? 0 : -5,
          }}
          transition={{ duration: 0.2 }}
        >
          <GripVertical className="w-4 h-4 text-muted cursor-grab active:cursor-grabbing" />
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Header with priority badge and menu */}
          <div className="flex items-center justify-between mb-2">
            <motion.div
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded border inline-flex items-center gap-1.5',
                priority.bg,
                priority.text,
                priority.border
              )}
              whileHover={{ scale: 1.05 }}
              transition={springPhysics.snappy}
            >
              <motion.span
                className={cn('w-1.5 h-1.5 rounded-full', priority.dot)}
                animate={{
                  scale: task.priority === 'critical' ? [1, 1.3, 1] : 1,
                }}
                transition={{
                  duration: 1,
                  repeat: task.priority === 'critical' ? Infinity : 0,
                }}
              />
              {priorityLabels[task.priority]}
            </motion.div>
            <motion.button
              className="p-1 hover:bg-background rounded transition-colors"
              animate={{
                opacity: isHovered ? 1 : 0,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MoreHorizontal className="w-4 h-4 text-muted" />
            </motion.button>
          </div>

          {/* Title with strikethrough animation for completed */}
          <motion.h4
            className={cn(
              'font-medium text-foreground mb-2 line-clamp-2 relative',
              isCompleted && 'text-muted'
            )}
            layout
          >
            {task.title}
            {isCompleted && (
              <motion.div
                className="absolute left-0 top-1/2 h-0.5 bg-muted"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
            )}
          </motion.h4>

          {/* Description */}
          <AnimatePresence>
            {task.description && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-muted line-clamp-2 mb-3"
              >
                {task.description}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Project indicator with color */}
          {task.project && (
            <motion.div
              className="flex items-center gap-2 mb-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.project.color }}
                whileHover={{ scale: 1.2 }}
              />
              <span className="text-xs font-medium text-foreground/80 truncate">
                {task.project.name}
              </span>
            </motion.div>
          )}

          {/* Fallback project indicator */}
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
              <motion.div
                className="flex items-center gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <User className="w-3 h-3 text-accent" />
                </motion.div>
                <span className="text-xs text-muted">{task.assigned_to}</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted">
                <User className="w-4 h-4 opacity-50" />
                <span className="text-xs">Sin asignar</span>
              </div>
            )}

            {/* Dates section */}
            <div className="flex flex-col items-end gap-0.5">
              {/* Creation date */}
              {task.created_at && (
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Calendar className="w-3 h-3" />
                  <span>{formatShortDate(task.created_at)}</span>
                </div>
              )}

              {/* Completed date with checkmark animation */}
              {task.completed_at && (
                <motion.div
                  className="flex items-center gap-1 text-xs text-success"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={springPhysics.bouncy}
                >
                  <AnimatedCheckmark show />
                  <span>{formatShortDate(task.completed_at)}</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completion overlay animation */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            className="absolute inset-0 bg-success/5 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
