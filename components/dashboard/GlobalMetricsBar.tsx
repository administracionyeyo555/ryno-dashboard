'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  FileCode,
  User,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { useGlobalMetrics } from '@/hooks/useGlobalMetrics'
import { formatRelativeTime } from '@/lib/utils'

interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string
  color: string
  index: number
  isLoading?: boolean
}

function MetricItem({ icon, label, value, subValue, color, index, isLoading }: MetricItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-2"
    >
      <motion.div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color }}
        >
          {icon}
        </motion.div>
      </motion.div>
      <div className="flex flex-col">
        <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.span
                key={String(value)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm font-semibold text-foreground"
              >
                {value}
              </motion.span>
            </AnimatePresence>
          )}
          {subValue && !isLoading && (
            <span className="text-xs text-muted">({subValue})</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Separator component
function Separator() {
  return (
    <div className="w-px h-8 bg-border hidden md:block" />
  )
}

export function GlobalMetricsBar() {
  const { metrics, loading } = useGlobalMetrics()

  // Format the last event time
  const lastEventDisplay = metrics.lastEventTime
    ? formatRelativeTime(metrics.lastEventTime)
    : 'Sin eventos'

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40"
    >
      <div className="max-w-[1800px] mx-auto px-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between py-1">
          <div className="flex items-center">
            {/* Activity indicator */}
            <motion.div
              className="flex items-center gap-2 pr-4 border-r border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-success"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-xs font-medium text-muted">HOY</span>
            </motion.div>

            <MetricItem
              icon={<Activity className="w-4 h-4" />}
              label="Sesiones"
              value={metrics.sessionsToday}
              color="#22c55e"
              index={0}
              isLoading={loading}
            />

            <Separator />

            <MetricItem
              icon={<FileCode className="w-4 h-4" />}
              label="Archivos"
              value={metrics.filesModifiedToday}
              color="#3b82f6"
              index={1}
              isLoading={loading}
            />

            <Separator />

            <MetricItem
              icon={<User className="w-4 h-4" />}
              label="Agente Top"
              value={metrics.mostActiveAgent?.name || '-'}
              subValue={metrics.mostActiveAgent ? `${metrics.mostActiveAgent.eventCount} eventos` : undefined}
              color="#FF6B35"
              index={2}
              isLoading={loading}
            />

            <Separator />

            <MetricItem
              icon={<Clock className="w-4 h-4" />}
              label="Ultimo Evento"
              value={lastEventDisplay}
              color="#eab308"
              index={3}
              isLoading={loading}
            />
          </div>

          {/* Live indicator */}
          <motion.div
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-success"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-medium text-success">LIVE</span>
          </motion.div>
        </div>

        {/* Mobile Layout - Compact */}
        <div className="flex md:hidden items-center justify-between py-2 overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max">
            {/* Activity dot */}
            <motion.div
              className="w-2 h-2 rounded-full bg-success flex-shrink-0"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Compact metrics */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-medium text-foreground">
                  {loading ? '-' : metrics.sessionsToday}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-info" />
                <span className="text-xs font-medium text-foreground">
                  {loading ? '-' : metrics.filesModifiedToday}
                </span>
              </div>

              {metrics.mostActiveAgent && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
                    {metrics.mostActiveAgent.name.split(' ').pop()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile live indicator */}
          <motion.div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 flex-shrink-0"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-1 rounded-full bg-success"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-[10px] font-medium text-success">LIVE</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom glow effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}
