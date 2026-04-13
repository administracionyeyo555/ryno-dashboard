'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number // in ms, default 8000
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-accent" />,
}

const toastStyles: Record<ToastType, string> = {
  success: 'border-green-500/30 bg-green-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  info: 'border-accent/30 bg-accent/10',
}

// Slide-in from right animation variants
const toastVariants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const,
    },
  },
}

function Toast({ toast, onDismiss }: ToastProps) {
  const { id, type, title, message, duration = 8000 } = toast

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'relative flex items-start gap-3 w-80 p-4 rounded-lg border backdrop-blur-sm shadow-lg',
        'bg-card/95',
        toastStyles[type]
      )}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        {toastIcons[type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">
          {title}
        </p>
        {message && (
          <p className="mt-1 text-xs text-muted line-clamp-2">
            {message}
          </p>
        )}
      </div>

      {/* Close button */}
      <motion.button
        onClick={() => onDismiss(id)}
        className="shrink-0 p-1 rounded-md hover:bg-background/50 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Cerrar notificacion"
      >
        <X className="w-4 h-4 text-muted" />
      </motion.button>

      {/* Progress bar */}
      <motion.div
        className={cn(
          'absolute bottom-0 left-0 h-0.5 rounded-b-lg',
          type === 'success' && 'bg-green-500',
          type === 'error' && 'bg-red-500',
          type === 'warning' && 'bg-yellow-500',
          type === 'info' && 'bg-accent'
        )}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toast
