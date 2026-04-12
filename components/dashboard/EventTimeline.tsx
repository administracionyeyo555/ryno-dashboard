'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench,
  FileEdit,
  FileSearch,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Inbox,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { AgentEvent } from '@/types/database'

interface EventTimelineProps {
  events: AgentEvent[]
  showProject?: boolean
}

const eventIcons = {
  tool_use: Wrench,
  file_edit: FileEdit,
  file_read: FileSearch,
  error: AlertCircle,
  completion: CheckCircle2,
  message: MessageSquare,
}

const eventColors = {
  tool_use: 'text-accent',
  file_edit: 'text-info',
  file_read: 'text-muted',
  error: 'text-error',
  completion: 'text-success',
  message: 'text-warning',
}

interface EventItemProps {
  event: AgentEvent
  showProject?: boolean
  index: number
}

function EventItem({ event, showProject, index }: EventItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = eventIcons[event.event_type] || MessageSquare
  const colorClass = eventColors[event.event_type] || 'text-muted'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'timeline-item',
        event.event_type === 'error' && 'active'
      )}
    >
      <div
        className="flex items-start gap-3 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center bg-card border border-border',
            colorClass
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground capitalize">
              {event.event_type.replace('_', ' ')}
            </span>
            {event.tool_name && (
              <span className="tool-tag">{event.tool_name}</span>
            )}
            <span className="text-xs text-muted ml-auto">
              {formatRelativeTime(event.created_at)}
            </span>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted" />
              )}
            </button>
          </div>

          {event.file_path && (
            <p className="text-sm text-muted font-mono truncate mt-1">
              {event.file_path}
            </p>
          )}

          {event.message && !isExpanded && (
            <p className="text-sm text-muted truncate mt-1">{event.message}</p>
          )}

          {showProject && event.project && (
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: event.project.color }}
              />
              <span className="text-xs text-muted">{event.project.name}</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-11 mt-2 overflow-hidden"
          >
            <div className="bg-background rounded-lg p-3 border border-border">
              {event.message && (
                <div className="mb-2">
                  <p className="text-xs text-muted mb-1">Message</p>
                  <p className="text-sm text-foreground">{event.message}</p>
                </div>
              )}
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-1">Metadata</p>
                  <pre className="text-xs font-mono text-muted bg-card p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Componente de empty state mejorado
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16"
    >
      {/* Icono animado */}
      <div className="relative mb-6">
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: 80, height: 80 }}
        />
        <div className="relative w-20 h-20 rounded-full bg-card border-2 border-border flex items-center justify-center">
          <Inbox className="w-8 h-8 text-muted" />
        </div>
      </div>

      {/* Texto */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-foreground mb-2"
      >
        Sin actividad reciente
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted text-center max-w-sm mb-4"
      >
        Los eventos de los agentes apareceran aqui cuando empiecen a trabajar en tus proyectos.
      </motion.p>

      {/* Indicador */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 text-xs text-muted/70"
      >
        <Clock className="w-3 h-3" />
        <span>Se actualiza automaticamente</span>
      </motion.div>

      {/* Dots animados */}
      <motion.div
        className="flex gap-1.5 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent/50"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}

export function EventTimeline({ events, showProject = false }: EventTimelineProps) {
  if (events.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => (
        <EventItem
          key={event.id}
          event={event}
          showProject={showProject}
          index={index}
        />
      ))}
    </div>
  )
}
