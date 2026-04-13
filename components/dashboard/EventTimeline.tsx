'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Wrench,
  FileEdit,
  FileSearch,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  Clock,
  Inbox,
  Play,
  Square,
  File,
  Calendar,
  Tag,
  FolderOpen,
  Loader2,
} from 'lucide-react'
import { cn, formatRelativeTime, formatDateTime } from '@/lib/utils'
import type { TransformedEvent } from '@/hooks/useAgentEvents'
import {
  springPhysics,
  accordionVariants,
  fadeSlideLeftVariants,
  staggerContainerVariants,
} from '@/lib/animations'

interface EventTimelineProps {
  events: TransformedEvent[]
  showProject?: boolean
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

// Icons by event type
const eventIcons: Record<string, typeof Wrench> = {
  tool_use: Wrench,
  file_edit: FileEdit,
  file_read: FileSearch,
  error: AlertCircle,
  completion: CheckCircle2,
  message: MessageSquare,
  SessionStart: Play,
  Stop: Square,
  PostToolUse: Wrench,
  PreToolUse: Wrench,
}

// Colors by event type
const eventColors: Record<string, string> = {
  tool_use: 'text-accent',
  file_edit: 'text-info',
  file_read: 'text-muted',
  error: 'text-error',
  completion: 'text-success',
  message: 'text-warning',
  SessionStart: 'text-success',
  Stop: 'text-error',
  PostToolUse: 'text-accent',
  PreToolUse: 'text-accent',
}

// Background colors by event type
const eventBgColors: Record<string, string> = {
  tool_use: 'bg-accent/10 border-accent/30',
  file_edit: 'bg-info/10 border-info/30',
  file_read: 'bg-muted/10 border-border',
  error: 'bg-error/10 border-error/30',
  completion: 'bg-success/10 border-success/30',
  message: 'bg-warning/10 border-warning/30',
  SessionStart: 'bg-success/10 border-success/30',
  Stop: 'bg-error/10 border-error/30',
  PostToolUse: 'bg-accent/10 border-accent/30',
  PreToolUse: 'bg-accent/10 border-accent/30',
}

// Readable labels for event types
const eventLabels: Record<string, string> = {
  tool_use: 'Tool Use',
  file_edit: 'Archivo Editado',
  file_read: 'Archivo Leido',
  error: 'Error',
  completion: 'Completado',
  message: 'Mensaje',
  SessionStart: 'Sesion Iniciada',
  Stop: 'Sesion Detenida',
  PostToolUse: 'Post Tool Use',
  PreToolUse: 'Pre Tool Use',
}

interface EventItemProps {
  event: TransformedEvent
  showProject?: boolean
  index: number
}

function EventItem({ event, showProject, index }: EventItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const displayType = event.original_event_type || event.event_type
  const Icon = eventIcons[displayType] || eventIcons[event.event_type] || MessageSquare
  const colorClass = eventColors[displayType] || eventColors[event.event_type] || 'text-muted'
  const bgColorClass = eventBgColors[displayType] || eventBgColors[event.event_type] || 'bg-card border-border'

  const exactTimestamp = formatDateTime(event.created_at)
  const relativeTime = formatRelativeTime(event.created_at)
  const fileName = event.file_path ? event.file_path.split(/[/\\]/).pop() : null

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeSlideLeftVariants}
      custom={index}
      className={cn(
        'relative pl-8 py-3 border-l-2 transition-colors',
        isExpanded ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground/50'
      )}
    >
      {/* Timeline dot with animation */}
      <motion.div
        className={cn(
          'absolute left-[-5px] top-4 w-2 h-2 rounded-full transition-all',
          isExpanded ? 'bg-accent' : 'bg-muted-foreground/50'
        )}
        animate={isExpanded ? { scale: 1.25 } : { scale: 1 }}
        transition={springPhysics.bouncy}
      />

      {/* Draw line animation for timeline */}
      <motion.div
        className="absolute left-[-1px] top-0 w-0.5 bg-accent/30"
        initial={{ height: 0 }}
        animate={isInView ? { height: '100%' } : { height: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
        style={{ display: isExpanded ? 'block' : 'none' }}
      />

      <div
        className="flex items-start gap-3 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Event icon with hover animation */}
        <motion.div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center border transition-all',
            bgColorClass,
            colorClass
          )}
          whileHover={{ scale: 1.1 }}
          transition={springPhysics.snappy}
        >
          <Icon className="w-4 h-4" />
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Event header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-semibold', colorClass)}>
              {eventLabels[displayType] || displayType}
            </span>

            {event.tool_name && (
              <motion.span
                className="px-2 py-0.5 text-xs font-mono bg-card border border-border rounded"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {event.tool_name}
              </motion.span>
            )}

            <span className="text-xs text-muted ml-auto flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {relativeTime}
            </span>

            <motion.button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted/20 rounded"
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={springPhysics.snappy}
            >
              <ChevronRight className="w-4 h-4 text-muted" />
            </motion.button>
          </div>

          {/* File name preview */}
          {fileName && !isExpanded && (
            <motion.div
              className="flex items-center gap-1 mt-1 text-sm text-muted"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <File className="w-3 h-3" />
              <span className="font-mono truncate">{fileName}</span>
            </motion.div>
          )}

          {/* Message preview */}
          {event.message && !isExpanded && !fileName && (
            <p className="text-sm text-muted truncate mt-1">{event.message}</p>
          )}

          {/* Project badge (collapsed) */}
          {showProject && event.project && !isExpanded && (
            <motion.div
              className="flex items-center gap-2 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.project.color }}
              />
              <span className="text-xs text-muted">{event.project.name}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Expanded details panel with accordion animation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={accordionVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="ml-12 mt-3 overflow-hidden"
          >
            <motion.div
              className="bg-background rounded-lg p-4 border border-border space-y-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Event type */}
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted" />
                <span className="text-xs text-muted">Tipo de Evento:</span>
                <span className={cn('text-sm font-mono', colorClass)}>
                  {displayType}
                </span>
              </div>

              {/* Tool name */}
              {event.tool_name && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Wrench className="w-4 h-4 text-muted" />
                  <span className="text-xs text-muted">Herramienta:</span>
                  <span className="text-sm font-mono text-foreground">
                    {event.tool_name}
                  </span>
                </motion.div>
              )}

              {/* Full file path */}
              {event.file_path && (
                <motion.div
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <FolderOpen className="w-4 h-4 text-muted mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted block">Ruta Completa:</span>
                    <p className="text-sm font-mono text-foreground break-all mt-0.5 bg-card p-2 rounded border border-border">
                      {event.file_path}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Exact timestamp */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted" />
                <span className="text-xs text-muted">Timestamp:</span>
                <span className="text-sm text-foreground">
                  {exactTimestamp}
                </span>
                <span className="text-xs text-muted">({relativeTime})</span>
              </div>

              {/* Project with color */}
              {showProject && event.project && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: event.project.color }}
                  />
                  <span className="text-xs text-muted">Proyecto:</span>
                  <span className="text-sm font-medium text-foreground">
                    {event.project.name}
                  </span>
                  <span className="text-xs text-muted font-mono">
                    ({event.project.slug})
                  </span>
                </motion.div>
              )}

              {/* Message */}
              {event.message && (
                <div>
                  <span className="text-xs text-muted block mb-1">Mensaje:</span>
                  <p className="text-sm text-foreground bg-card p-2 rounded border border-border">
                    {event.message}
                  </p>
                </div>
              )}

              {/* Metadata */}
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-xs text-muted block mb-1">Metadata / Detalles:</span>
                  <pre className="text-xs font-mono text-muted bg-card p-3 rounded border border-border overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </motion.div>
              )}

              {/* Session ID */}
              {event.session_id && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted">Session ID:</span>
                  <span className="text-xs font-mono text-muted/70">
                    {event.session_id}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Empty state component
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16"
    >
      {/* Animated icon */}
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

      {/* Text */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-foreground mb-2"
      >
        Sin actividad aun
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted text-center max-w-sm mb-4"
      >
        Los eventos de los agentes apareceran aqui cuando empiecen a trabajar en tus proyectos.
      </motion.p>

      {/* Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 text-xs text-muted/70"
      >
        <Clock className="w-3 h-3" />
        <span>Se actualiza automaticamente</span>
      </motion.div>

      {/* Animated dots */}
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

// Load more indicator
function LoadMoreIndicator({
  loading,
  hasMore,
  onLoadMore
}: {
  loading: boolean
  hasMore: boolean
  onLoadMore?: () => void
}) {
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [onLoadMore, hasMore, loading])

  if (!hasMore && !loading) return null

  return (
    <div ref={observerRef} className="flex items-center justify-center py-6">
      {loading ? (
        <motion.div
          className="flex items-center gap-2 text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-5 h-5" />
          </motion.div>
          <span className="text-sm">Cargando mas eventos...</span>
        </motion.div>
      ) : hasMore ? (
        <motion.button
          onClick={onLoadMore}
          className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Cargar mas eventos
        </motion.button>
      ) : null}
    </div>
  )
}

export function EventTimeline({
  events,
  showProject = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore
}: EventTimelineProps) {
  if (events.length === 0) {
    return <EmptyState />
  }

  return (
    <motion.div
      className="space-y-0"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {events.map((event, index) => (
        <EventItem
          key={event.id}
          event={event}
          showProject={showProject}
          index={index}
        />
      ))}

      <LoadMoreIndicator
        loading={loadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />
    </motion.div>
  )
}
