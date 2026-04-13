'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// ============================================
// SKELETON BASE COMPONENT
// ============================================
interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'rounded' | 'text'
  width?: string | number
  height?: string | number
  animation?: 'shimmer' | 'pulse' | 'none'
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animation = 'shimmer',
}: SkeletonProps) {
  const baseStyles = 'bg-border/50 overflow-hidden relative'

  const variantStyles = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    text: 'rounded h-4',
  }

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  if (animation === 'pulse') {
    return (
      <motion.div
        className={cn(baseStyles, variantStyles[variant], className)}
        style={style}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    )
  }

  if (animation === 'none') {
    return (
      <div
        className={cn(baseStyles, variantStyles[variant], className)}
        style={style}
      />
    )
  }

  // Shimmer animation (default)
  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
        }}
        animate={{ x: ['0%', '200%'] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

// ============================================
// SKELETON CARD
// ============================================
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-4 space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={10} />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Skeleton width="100%" height={12} />
        <Skeleton width="80%" height={12} />
        <Skeleton width="90%" height={12} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton width={60} height={20} variant="rounded" />
        <Skeleton width={80} height={10} />
      </div>
    </div>
  )
}

// ============================================
// SKELETON AGENT CARD
// ============================================
export function SkeletonAgentCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-4 space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" width={40} height={40} />
          <div className="space-y-2">
            <Skeleton width={100} height={14} />
            <Skeleton width={70} height={10} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={8} height={8} />
          <Skeleton width={50} height={10} />
        </div>
      </div>

      {/* Current Activity */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton width={16} height={16} />
          <Skeleton width={80} height={20} variant="rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={16} height={16} />
          <Skeleton width={150} height={12} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton width={50} height={10} />
          <Skeleton width={30} height={10} />
        </div>
        <Skeleton width="100%" height={6} variant="rounded" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Skeleton width={16} height={16} />
          <Skeleton width={50} height={12} />
        </div>
        <Skeleton width={70} height={12} />
      </div>
    </div>
  )
}

// ============================================
// SKELETON PROJECT CARD
// ============================================
export function SkeletonProjectCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-5 space-y-4 relative overflow-hidden',
        className
      )}
    >
      {/* Color bar */}
      <Skeleton
        width="100%"
        height={4}
        className="absolute top-0 left-0 right-0"
      />

      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" width={48} height={48} />
          <div className="space-y-2">
            <Skeleton width={120} height={16} />
            <div className="flex items-center gap-2">
              <Skeleton width={80} height={10} />
              <Skeleton width={60} height={10} />
            </div>
          </div>
        </div>
        <Skeleton width={80} height={24} variant="rounded" />
      </div>

      {/* Last Commit */}
      <div className="bg-background/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between">
          <Skeleton width={120} height={10} />
          <Skeleton width={60} height={10} />
        </div>
        <Skeleton width="90%" height={12} />
        <div className="space-y-1 pt-2 border-t border-border/30">
          <Skeleton width="70%" height={10} />
          <Skeleton width="50%" height={10} />
        </div>
      </div>

      {/* Git Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 py-3 bg-background/50 rounded-lg px-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center space-y-1">
            <Skeleton width={16} height={16} />
            <Skeleton width={30} height={16} />
            <Skeleton width={40} height={8} />
          </div>
        ))}
      </div>

      {/* Health Bar */}
      <div className="flex items-center gap-2">
        <Skeleton width={16} height={16} />
        <Skeleton width="100%" height={8} variant="rounded" className="flex-1" />
        <Skeleton width={30} height={12} />
      </div>
    </div>
  )
}

// ============================================
// SKELETON TASK CARD
// ============================================
export function SkeletonTaskCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-3 space-y-3',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={60} height={20} variant="rounded" />
        <Skeleton width={20} height={20} />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Skeleton width="90%" height={14} />
        <Skeleton width="60%" height={12} />
      </div>

      {/* Project */}
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={12} height={12} />
        <Skeleton width={80} height={10} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton width={50} height={10} />
        </div>
        <Skeleton width={60} height={10} />
      </div>
    </div>
  )
}

// ============================================
// SKELETON TIMELINE EVENT
// ============================================
export function SkeletonTimelineEvent({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative pl-8 py-3 border-l-2 border-border', className)}
    >
      {/* Timeline dot */}
      <Skeleton
        variant="circular"
        width={8}
        height={8}
        className="absolute left-[-5px] top-4"
      />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <Skeleton variant="rounded" width={36} height={36} />

        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={18} variant="rounded" />
            <Skeleton width={60} height={10} className="ml-auto" />
          </div>

          {/* File name */}
          <div className="flex items-center gap-1">
            <Skeleton width={12} height={12} />
            <Skeleton width={120} height={10} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SKELETON METRIC CARD
// ============================================
export function SkeletonMetricCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" width={40} height={40} />
        <div className="space-y-2">
          <Skeleton width={80} height={24} />
          <Skeleton width={50} height={10} />
        </div>
      </div>
    </div>
  )
}

// ============================================
// SKELETON TABLE ROW
// ============================================
export function SkeletonTableRow({
  columns = 4,
  className,
}: {
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-4 py-3 border-b border-border', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          width={`${100 / columns}%`}
          height={12}
          className="flex-1"
        />
      ))}
    </div>
  )
}

// ============================================
// SKELETON TEXT BLOCK
// ============================================
export function SkeletonTextBlock({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={12}
        />
      ))}
    </div>
  )
}

export default Skeleton
