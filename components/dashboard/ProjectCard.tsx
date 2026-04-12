'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Folder,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  GitCommit,
  FileCode,
  Code2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/database'

interface ProjectMetrics {
  commits: number
  files: number
  lines: string
}

interface ProjectCardProps {
  project: Project
  index?: number
  onClick?: () => void
  metrics?: ProjectMetrics
}

// Componente de animacion de contador
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.floor(easeOutQuart * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{displayValue}</span>
}

export function ProjectCard({ project, index = 0, onClick, metrics }: ProjectCardProps) {
  const healthColor =
    project.health_score >= 80
      ? 'text-success'
      : project.health_score >= 50
      ? 'text-warning'
      : 'text-error'

  const statusIcons = {
    active: Activity,
    paused: Clock,
    completed: CheckCircle2,
    error: AlertTriangle,
  }

  const StatusIcon = statusIcons[project.status]

  // Default metrics si no se proporcionan
  const projectMetrics = metrics || { commits: 0, files: 0, lines: '0' }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="card cursor-pointer relative overflow-hidden group"
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
        style={{ backgroundColor: project.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pt-2">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${project.color}20` }}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Folder className="w-6 h-6" style={{ color: project.color }} />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {project.name}
            </h3>
            <p className="text-sm text-muted">{project.slug}</p>
          </div>
        </div>
        <div
          className={cn(
            'badge',
            project.status === 'active' && 'badge-success',
            project.status === 'paused' && 'badge-warning',
            project.status === 'completed' && 'badge-info',
            project.status === 'error' && 'badge-error'
          )}
        >
          <StatusIcon className="w-3 h-3 mr-1" />
          {project.status}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-muted mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Development Metrics - Nueva seccion */}
      {(projectMetrics.commits > 0 || projectMetrics.files > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.2 }}
          className="grid grid-cols-3 gap-3 py-3 mb-3 bg-background/50 rounded-lg px-3"
        >
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-accent" />
            <div>
              <p className="text-lg font-bold text-foreground">
                <AnimatedCounter value={projectMetrics.commits} />
              </p>
              <p className="text-[10px] text-muted">commits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-info" />
            <div>
              <p className="text-lg font-bold text-foreground">
                <AnimatedCounter value={projectMetrics.files} />
              </p>
              <p className="text-[10px] text-muted">archivos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-success" />
            <div>
              <p className="text-lg font-bold text-foreground">
                {projectMetrics.lines}
              </p>
              <p className="text-[10px] text-muted">lineas</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats originales */}
      <div className="grid grid-cols-3 gap-4 py-4 border-t border-border">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.3 }}
        >
          <p className="text-2xl font-bold text-foreground">
            <AnimatedCounter value={project.total_sessions} />
          </p>
          <p className="text-xs text-muted">Sessions</p>
        </motion.div>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.35 }}
        >
          <p className="text-2xl font-bold text-foreground">
            <AnimatedCounter value={project.total_events} />
          </p>
          <p className="text-xs text-muted">Events</p>
        </motion.div>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.4 }}
        >
          <p className="text-2xl font-bold text-foreground">
            <AnimatedCounter value={project.total_tasks} />
          </p>
          <p className="text-xs text-muted">Tasks</p>
        </motion.div>
      </div>

      {/* Health Score */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className={cn('w-4 h-4', healthColor)} />
          <span className="text-sm text-muted">Health Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor:
                  project.health_score >= 80
                    ? '#22c55e'
                    : project.health_score >= 50
                    ? '#eab308'
                    : '#ef4444',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${project.health_score}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: 'easeOut' }}
            />
          </div>
          <span className={cn('text-sm font-medium', healthColor)}>
            {project.health_score > 0 ? `${project.health_score}%` : '-'}
          </span>
        </div>
      </div>

      {/* Hover effect overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
      />
    </motion.div>
  )
}
