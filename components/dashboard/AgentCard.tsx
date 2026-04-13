'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileCode, Clock, Wrench, Folder, AlertCircle, Activity, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatTime, formatRelativeTimeShort } from '@/lib/utils'
import type { AgentSession, AgentEvent } from '@/types/database'
import {
  springPhysics,
  pulsingBorderVariants,
  progressBarSpring,
  animateNumber,
} from '@/lib/animations'

interface AgentCardProps {
  session: AgentSession
  index?: number
  isDemo?: boolean
  onClick?: () => void
}

// Componente de animacion "typing"
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 ml-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-accent"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

// Mini timeline event item with stagger animation
function MiniTimelineEvent({ event, index }: { event: AgentEvent; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, ...springPhysics.snappy }}
      className="flex items-center gap-2 text-xs"
    >
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-accent/60"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
      />
      <span className="tool-tag !text-[10px] !px-1.5 !py-0.5">
        {event.tool_name || event.event_type}
      </span>
      {event.file_path && (
        <span className="text-muted font-mono truncate max-w-[100px]">
          {event.file_path.split('/').pop()}
        </span>
      )}
      <span className="text-muted/70 ml-auto">
        {formatRelativeTimeShort(event.timestamp)}
      </span>
    </motion.div>
  )
}

// Animated counter component
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    animateNumber(displayValue, value, 1000, setDisplayValue)
  }, [value])

  return (
    <motion.span
      key={displayValue}
      className={className}
      initial={{ opacity: 0.5, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {displayValue}
    </motion.span>
  )
}

export function AgentCard({ session, index = 0, isDemo = false, onClick }: AgentCardProps) {
  const [recentEvents, setRecentEvents] = useState<AgentEvent[]>([])
  const [runningTime, setRunningTime] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null)
  const [secondsSinceLastEvent, setSecondsSinceLastEvent] = useState(0)

  const statusColors = {
    running: 'bg-success',
    active: 'bg-success',
    idle: 'bg-warning',
    error: 'bg-error',
    completed: 'bg-info',
    stopped: 'bg-muted',
  }

  const statusLabels = {
    running: 'Running',
    active: 'Active',
    idle: 'Idle',
    error: 'Error',
    completed: 'Completed',
    stopped: 'Stopped',
  }

  const isActive = session.status === 'running' || session.status === 'active'

  // Fetch recent events for this session
  const fetchRecentEvents = useCallback(async () => {
    if (isDemo) return

    const { data, error } = await supabase
      .from('agent_events')
      .select('*')
      .eq('session_id', session.id)
      .order('timestamp', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Error fetching recent events:', error)
      return
    }

    const transformedEvents = (data || []).map(event => ({
      ...event,
      created_at: event.timestamp,
      metadata: event.detail,
      message: event.detail?.message || null,
    }))

    setRecentEvents(transformedEvents as AgentEvent[])

    // Update last event time
    if (transformedEvents.length > 0) {
      setLastEventTime(new Date(transformedEvents[0].timestamp))
    }
  }, [session.id, isDemo])

  // Subscribe to real-time events for this session
  useEffect(() => {
    if (isDemo) return

    const channel = supabase
      .channel(`agent_card_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_events',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const newEvent = payload.new as AgentEvent
          setLastEventTime(new Date(newEvent.timestamp))
          setSecondsSinceLastEvent(0)

          // Add to recent events (keep only 3)
          setRecentEvents((prev) => {
            const updated = [{ ...newEvent, created_at: newEvent.timestamp } as AgentEvent, ...prev]
            return updated.slice(0, 3)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session.id, isDemo])

  // Update seconds since last event
  useEffect(() => {
    if (!lastEventTime || !isActive) return

    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastEventTime.getTime()) / 1000)
      setSecondsSinceLastEvent(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [lastEventTime, isActive])

  // Calculate running time from started_at
  const calculateRunningTime = useCallback(() => {
    if (!session.started_at) return 0
    const start = new Date(session.started_at).getTime()
    const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now()
    return Math.floor((end - start) / 1000)
  }, [session.started_at, session.ended_at])

  // Fetch events on mount
  useEffect(() => {
    fetchRecentEvents()
  }, [fetchRecentEvents])

  // Update running time every second
  useEffect(() => {
    setRunningTime(calculateRunningTime())

    if (isActive) {
      const interval = setInterval(() => {
        setRunningTime(calculateRunningTime())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [calculateRunningTime, isActive])

  // Progress calculation
  const maxExpectedEvents = 100
  const progressPercentage = Math.min((session.events_count || 0) / maxExpectedEvents * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.1, ...springPhysics.smooth }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'card group relative overflow-hidden cursor-pointer transition-all duration-300',
        isHovered && 'shadow-lg shadow-accent/10'
      )}
      style={{
        borderColor: isActive && isHovered
          ? 'rgba(255, 107, 53, 0.5)'
          : undefined,
      }}
    >
      {/* Pulsing border for active agents */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            variants={pulsingBorderVariants}
            initial="inactive"
            animate="active"
            exit="inactive"
            style={{
              border: '2px solid transparent',
            }}
          />
        )}
      </AnimatePresence>

      {/* Subtle pulse effect for active agents */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-accent/5 rounded-xl pointer-events-none"
          animate={{
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Hover lift effect with orange shadow */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{
          boxShadow: isHovered
            ? '0 20px 40px -10px rgba(255, 107, 53, 0.2)'
            : '0 0 0 0 rgba(255, 107, 53, 0)',
        }}
        transition={springPhysics.smooth}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: session.project?.color
                ? `${session.project.color}20`
                : 'rgba(255, 107, 53, 0.1)',
            }}
            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Folder
              className="w-5 h-5"
              style={{ color: session.project?.color || '#FF6B35' }}
            />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center">
              {session.agent_name}
              {isActive && isDemo && <TypingIndicator />}
            </h3>
            <p className="text-sm text-muted">
              {session.project?.name || 'Unknown Project'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Inactivity badge - shows when no activity for 30+ seconds */}
          {isActive && secondsSinceLastEvent >= 30 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded"
            >
              {secondsSinceLastEvent >= 60 ? `${Math.floor(secondsSinceLastEvent / 60)}m` : `${secondsSinceLastEvent}s`} idle
            </motion.span>
          )}
          <motion.span
            className={cn('status-dot', statusColors[session.status])}
            animate={isActive ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs text-muted">{statusLabels[session.status]}</span>
        </div>
      </div>

      {/* Current Activity */}
      <div className="space-y-3 relative z-10">
        <AnimatePresence mode="wait">
          {session.current_tool && (
            <motion.div
              key={session.current_tool}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={springPhysics.snappy}
            >
              <Wrench className="w-4 h-4 text-accent" />
              <motion.span
                className="tool-tag"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springPhysics.bouncy}
              >
                {session.current_tool}
              </motion.span>
              {isActive && isDemo && (
                <motion.span
                  className="text-xs text-accent"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  trabajando...
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {session.current_file && (
            <motion.div
              key={session.current_file}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: 0.1, ...springPhysics.snappy }}
            >
              <FileCode className="w-4 h-4 text-muted" />
              <span className="text-sm text-muted font-mono truncate max-w-[200px]" title={session.current_file}>
                {session.current_file.split('/').pop()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {session.status === 'error' && (
          <motion.div
            className="flex items-center gap-2 text-error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springPhysics.bouncy}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Error occurred</span>
          </motion.div>
        )}
      </div>

      {/* Mini Timeline */}
      {!isDemo && recentEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 pt-3 border-t border-border/50 relative z-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3 h-3 text-muted" />
            <span className="text-xs text-muted font-medium">Actividad reciente</span>
          </div>
          <div className="space-y-1.5">
            {recentEvents.map((event, idx) => (
              <MiniTimelineEvent key={event.id} event={event} index={idx} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Progress Bar with spring animation */}
      <div className="mt-4 relative z-10">
        <div className="flex items-center justify-between text-xs text-muted mb-1">
          <span>Progreso</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={progressBarSpring}
          />
        </div>
      </div>

      {/* Footer with animated counter */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted">
            <Clock className="w-4 h-4" />
            <motion.span
              key={runningTime}
              className="text-sm"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
            >
              {formatTime(runningTime)}
            </motion.span>
          </div>
          {/* Last event indicator */}
          {lastEventTime && (
            <div className="text-xs text-muted/70">
              Last: {formatRelativeTimeShort(lastEventTime)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted flex items-center gap-1">
            <AnimatedCounter value={session.events_count ?? 0} />
            <span>events</span>
          </div>
          <motion.div
            animate={{ x: isHovered ? 3 : 0 }}
            transition={springPhysics.snappy}
          >
            <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
          </motion.div>
        </div>
      </div>

      {/* Bottom progress indicator for active agents */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-accent via-accent/70 to-accent rounded-b-xl"
          initial={{ width: '0%' }}
          animate={{ width: ['0%', '100%', '0%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  )
}
