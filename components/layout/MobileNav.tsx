'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Folder, Clock, CheckSquare, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'
import { useState } from 'react'
import {
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react'
import type { AgentNotification } from '@/hooks/useNotifications'

const navItems = [
  { name: 'Live', href: '/monitor/live', icon: Activity },
  { name: 'Proyectos', href: '/monitor/projects', icon: Folder },
  { name: 'Historial', href: '/monitor/history', icon: Clock },
  { name: 'Tareas', href: '/monitor/tasks', icon: CheckSquare },
]

function getNotificationIcon(type: AgentNotification['type']) {
  switch (type) {
    case 'success': return <Check className="w-3.5 h-3.5 text-success" />
    case 'error': return <AlertCircle className="w-3.5 h-3.5 text-error" />
    case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-warning" />
    default: return <Info className="w-3.5 h-3.5 text-accent" />
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export function MobileNav() {
  const pathname = usePathname()
  const [notifOpen, setNotifOpen] = useState(false)
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications({ limit: 10 })

  return (
    <>
      {/* Notifications Sheet */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
              onClick={() => setNotifOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] md:hidden bg-card border-t border-border rounded-t-2xl max-h-[70vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm">Notificaciones</span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-accent flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Marcar todas
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 rounded-lg hover:bg-background"
                  >
                    <CheckCheck className="w-4 h-4 text-muted" />
                  </button>
                </div>
              </div>

              {/* Notifications list */}
              <div className="overflow-y-auto flex-1 pb-safe">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted">
                    <Bell className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Sin notificaciones</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { if (!n.read) markAsRead(n.id) }}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/50 last:border-0 transition-colors',
                        !n.read ? 'bg-accent/5' : 'hover:bg-background/50'
                      )}
                    >
                      <div className="shrink-0 mt-0.5">{getNotificationIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm line-clamp-2', !n.read && 'font-medium')}>
                          {n.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted">{n.project_slug}</span>
                          <span className="text-[10px] text-muted">{formatRelativeTime(n.created_at)}</span>
                        </div>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around px-1 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative min-w-[56px]',
                  isActive ? 'text-accent' : 'text-muted'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveNav"
                    className="absolute inset-0 bg-accent/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn('w-5 h-5 relative z-10', isActive && 'text-accent')} />
                <span className={cn('text-[10px] font-medium relative z-10', isActive ? 'text-accent' : 'text-muted/70')}>
                  {item.name}
                </span>
              </Link>
            )
          })}

          {/* Notifications button */}
          <button
            onClick={() => setNotifOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative min-w-[56px] text-muted"
          >
            <div className="relative">
              <Bell className={cn('w-5 h-5', unreadCount > 0 ? 'text-accent' : 'text-muted')} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-error text-[9px] text-white font-bold rounded-full flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </div>
            <span className="text-[10px] font-medium text-muted/70 relative z-10">Notifs</span>
          </button>
        </div>
      </nav>
    </>
  )
}
