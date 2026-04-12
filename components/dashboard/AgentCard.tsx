'use client'

import { motion } from 'framer-motion'
import { FileCode, Clock, Wrench, Folder, AlertCircle, Type } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import type { AgentSession } from '@/types/database'

interface AgentCardProps {
  session: AgentSession
  index?: number
  isDemo?: boolean
}

// Componente de animacion "typing"
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 ml-2">
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-accent"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-accent"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
      />
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-accent"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  )
}

export function AgentCard({ session, index = 0, isDemo = false }: AgentCardProps) {
  const statusColors = {
    running: 'bg-success',
    idle: 'bg-warning',
    error: 'bg-error',
    completed: 'bg-info',
  }

  const statusLabels = {
    running: 'Running',
    idle: 'Idle',
    error: 'Error',
    completed: 'Completed',
  }

  const isActive = session.status === 'running'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={cn(
        'card group relative overflow-hidden',
        isActive && 'ring-1 ring-accent/30'
      )}
    >
      {/* Efecto pulse sutil para agentes activos */}
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
          <motion.span
            className={cn(
              'status-dot',
              statusColors[session.status]
            )}
            animate={isActive ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs text-muted">
            {statusLabels[session.status]}
          </span>
        </div>
      </div>

      {/* Current Activity */}
      <div className="space-y-3 relative z-10">
        {session.current_tool && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Wrench className="w-4 h-4 text-accent" />
            <motion.span
              className="tool-tag"
              key={session.current_tool}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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

        {session.current_file && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FileCode className="w-4 h-4 text-muted" />
            <span className="text-sm text-muted font-mono truncate max-w-[200px]">
              {session.current_file.split('/').pop()}
            </span>
          </motion.div>
        )}

        {session.status === 'error' && (
          <motion.div
            className="flex items-center gap-2 text-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Error occurred</span>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border relative z-10">
        <div className="flex items-center gap-2 text-muted">
          <Clock className="w-4 h-4" />
          <motion.span
            key={session.duration_seconds}
            className="text-sm"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
          >
            {formatTime(session.duration_seconds)}
          </motion.span>
        </div>
        <motion.div
          className="text-sm text-muted"
          key={session.events_count}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3 }}
        >
          {session.events_count} events
        </motion.div>
      </div>

      {/* Progress indicator animado */}
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
