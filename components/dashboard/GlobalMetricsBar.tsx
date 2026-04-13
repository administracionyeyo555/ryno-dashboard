'use client'

import React from 'react'
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
import {
  springPhysics,
  flipNumberVariants,
} from '@/lib/animations'

// ============================================
// FLIP COUNTER COMPONENT
// ============================================
interface FlipDigitProps {
  digit: string
  index: number
}

function FlipDigit({ digit }: FlipDigitProps) {
  return (
    <div className="relative h-6 w-4 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          variants={flipNumberVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 flex items-center justify-center font-bold text-foreground"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

interface FlipCounterProps {
  value: number | string
  className?: string
}

function FlipCounter({ value, className }: FlipCounterProps) {
  const stringValue = String(value)
  const digits = stringValue.split('')

  return (
    <div className={`flex items-center ${className}`}>
      {digits.map((digit, index) => (
        <FlipDigit key={`${index}-${digit}`} digit={digit} index={index} />
      ))}
    </div>
  )
}

// ============================================
// METRIC ITEM COMPONENT
// ============================================
interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string
  color: string
  index: number
  isLoading?: boolean
  useFlipCounter?: boolean
}

function MetricItem({
  icon,
  label,
  value,
  subValue,
  color,
  index,
  isLoading,
  useFlipCounter = false
}: MetricItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, ...springPhysics.smooth }}
      className="flex items-center gap-3 px-4 py-2"
    >
      <motion.div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
        whileHover={{ scale: 1.05 }}
        transition={springPhysics.snappy}
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-4 h-4 text-muted" />
            </motion.div>
          ) : useFlipCounter && typeof value === 'number' ? (
            <FlipCounter value={value} className="text-sm font-semibold" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.span
                key={String(value)}
                variants={flipNumberVariants}
                initial="initial"
                animate="animate"
                exit="exit"
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
    <motion.div
      className="w-px h-8 bg-border hidden md:block"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ delay: 0.3 }}
    />
  )
}

// ============================================
// LIVE INDICATOR WITH GLOW
// ============================================
function LiveIndicator() {
  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1 rounded-full relative"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.05) 100%)',
        border: '1px solid rgba(255, 107, 53, 0.3)',
      }}
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(255, 107, 53, 0)',
          '0 0 20px 2px rgba(255, 107, 53, 0.3)',
          '0 0 0 0 rgba(255, 107, 53, 0)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Pulsing dot with glow */}
      <motion.div
        className="relative w-2 h-2"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-accent"
          animate={{
            scale: [1, 2, 2],
            opacity: [0.8, 0, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Core dot */}
        <div className="absolute inset-0 rounded-full bg-accent" />
      </motion.div>

      <motion.span
        className="text-xs font-bold tracking-wider"
        style={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #ff8554 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        LIVE
      </motion.span>
    </motion.div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
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
      transition={{ duration: 0.4, ...springPhysics.smooth }}
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
                  opacity: [1, 0.7, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(34, 197, 94, 0.7)',
                    '0 0 0 4px rgba(34, 197, 94, 0)',
                    '0 0 0 0 rgba(34, 197, 94, 0)',
                  ],
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
              useFlipCounter
            />

            <Separator />

            <MetricItem
              icon={<FileCode className="w-4 h-4" />}
              label="Archivos"
              value={metrics.filesModifiedToday}
              color="#3b82f6"
              index={1}
              isLoading={loading}
              useFlipCounter
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

          {/* Live indicator with glow */}
          <LiveIndicator />
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
              <motion.div
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Activity className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-medium text-foreground">
                  {loading ? '-' : metrics.sessionsToday}
                </span>
              </motion.div>

              <motion.div
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FileCode className="w-3.5 h-3.5 text-info" />
                <span className="text-xs font-medium text-foreground">
                  {loading ? '-' : metrics.filesModifiedToday}
                </span>
              </motion.div>

              {metrics.mostActiveAgent && (
                <motion.div
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
                    {metrics.mostActiveAgent.name.split(' ').pop()}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Mobile live indicator */}
          <motion.div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: 'rgba(255, 107, 53, 0.1)',
              border: '1px solid rgba(255, 107, 53, 0.2)',
            }}
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(255, 107, 53, 0)',
                '0 0 10px 1px rgba(255, 107, 53, 0.2)',
                '0 0 0 0 rgba(255, 107, 53, 0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-1 rounded-full bg-accent"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-[10px] font-bold text-accent">LIVE</span>
          </motion.div>
        </div>
      </div>

      {/* Animated bottom glow line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.5), transparent)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}
