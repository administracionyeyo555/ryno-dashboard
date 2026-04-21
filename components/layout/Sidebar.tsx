'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  Folder,
  Clock,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Brain,
  Database,
  Wifi,
  WifiOff,
  LogOut,
  User,
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/dashboard-store'
import { useSupabaseStatus } from '@/hooks/useSupabaseStatus'
import { getUser, logout, type AuthUser } from '@/lib/auth'
import { useNotifications, type AgentNotification } from '@/hooks/useNotifications'

const navItems = [
  {
    name: 'Live',
    href: '/monitor/live',
    icon: Activity,
    description: 'Agentes activos',
  },
  {
    name: 'Proyectos',
    href: '/monitor/projects',
    icon: Folder,
    description: 'Vista de proyectos',
  },
  {
    name: 'Historial',
    href: '/monitor/history',
    icon: Clock,
    description: 'Timeline de eventos',
  },
  {
    name: 'Tareas',
    href: '/monitor/tasks',
    icon: CheckSquare,
    description: 'Kanban board',
  },
]

// Helper para obtener icono segun tipo de notificacion
function getNotificationIcon(type: AgentNotification['type']) {
  switch (type) {
    case 'success':
      return <Check className="w-4 h-4 text-success" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-error" />
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-warning" />
    default:
      return <Info className="w-4 h-4 text-accent" />
  }
}

// Helper para formatear fecha relativa
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isSidebarCollapsed, toggleSidebar } = useDashboardStore()
  const { isConnected, isChecking, lastCheck } = useSupabaseStatus(30000)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Hook de notificaciones
  const {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications({ limit: 10 })

  useEffect(() => {
    setUser(getUser())
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.notifications-dropdown')) {
        setIsNotificationsOpen(false)
      }
    }

    if (isNotificationsOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isNotificationsOpen])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Nombre de usuario mostrado (fallback a RYNOADMIN)
  const displayName = user?.displayName || 'RYNOADMIN'
  const role = user?.role === 'admin' ? 'Administrador' : 'Usuario'

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden md:flex fixed left-0 top-0 h-screen bg-card border-r border-border flex-col z-50"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link href="/monitor/live" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-accent" />
          </div>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              <span className="text-xl font-bold text-accent">RYNO</span>
              <span className="text-[10px] text-muted -mt-1">Studio</span>
            </motion.div>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-background rounded-lg transition-colors"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item',
                isActive && 'active',
                isSidebarCollapsed && 'justify-center px-0'
              )}
              title={isSidebarCollapsed ? item.name : undefined}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-accent')} />
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted">{item.description}</span>
                </motion.div>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 w-1 h-8 bg-accent rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Notifications Button */}
      <div className="px-3 pb-2 notifications-dropdown relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsNotificationsOpen(!isNotificationsOpen)
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-background/50',
            isSidebarCollapsed && 'justify-center px-0'
          )}
          title={isSidebarCollapsed ? `Notificaciones (${unreadCount})` : undefined}
        >
          <div className="relative">
            <Bell className={cn(
              'w-5 h-5',
              unreadCount > 0 ? 'text-accent' : 'text-muted'
            )} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-[10px] text-white font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1"
            >
              <span className="font-medium text-sm">Notificaciones</span>
              <span className="text-xs text-muted">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Sin notificaciones'}
              </span>
            </motion.div>
          )}
        </button>

        {/* Notifications Dropdown */}
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute bottom-full mb-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-[100]',
              isSidebarCollapsed ? 'left-full ml-2 w-80' : 'left-0 w-full'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
              <span className="font-semibold text-sm">Notificaciones</span>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    markAllAsRead()
                  }}
                  className="text-xs text-accent hover:text-accent/80 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todas
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {isLoadingNotifications ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted">
                  <Bell className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Sin notificaciones</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!notification.read) {
                        markAsRead(notification.id)
                      }
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-background/50 transition-colors border-b border-border/50 last:border-0',
                      !notification.read && 'bg-accent/5'
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm line-clamp-2',
                        !notification.read && 'font-medium'
                      )}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted">
                          {notification.project_slug}
                        </span>
                        <span className="text-[10px] text-muted">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="shrink-0">
                        <span className="w-2 h-2 rounded-full bg-accent block" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Supabase Connection Status */}
      <div className="px-3 pb-2">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
            isConnected ? 'bg-success/10' : 'bg-error/10',
            isSidebarCollapsed && 'justify-center px-0'
          )}
          title={
            isSidebarCollapsed
              ? isConnected
                ? 'Supabase conectado'
                : 'Supabase desconectado'
              : undefined
          }
        >
          <div className="relative">
            <Database
              className={cn(
                'w-5 h-5',
                isConnected ? 'text-success' : 'text-error'
              )}
            />
            {/* Indicador de estado pulsante */}
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card',
                isConnected ? 'bg-success' : 'bg-error',
                isChecking && 'animate-pulse'
              )}
            />
          </div>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isConnected ? 'text-success' : 'text-error'
                  )}
                >
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
                {isConnected ? (
                  <Wifi className="w-3 h-3 text-success" />
                ) : (
                  <WifiOff className="w-3 h-3 text-error" />
                )}
              </div>
              <span className="text-xs text-muted">
                {lastCheck
                  ? `Ultimo check: ${lastCheck.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Verificando...'}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* User Section */}
      <div className="px-3 pb-2">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20',
            isSidebarCollapsed && 'justify-center px-0'
          )}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <User className="w-4 h-4 text-accent" />
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
          </div>
          {!isSidebarCollapsed && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-bold text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted">{role}</p>
              </motion.div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-error/10 transition-colors group"
                title="Cerrar sesion"
              >
                <LogOut className="w-4 h-4 text-muted group-hover:text-error transition-colors" />
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Footer with Version */}
      <div className="p-4 border-t border-border">
        {!isSidebarCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between"
          >
            <div className="text-xs text-muted">
              <p className="font-medium text-foreground">RYNO Studio</p>
              <p className="text-accent font-semibold">v1.0.0</p>
            </div>
            <div className="flex items-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-success"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[10px] text-muted">Activo</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center"
            title="RYNO Studio v1.0.0"
          >
            <span className="text-[10px] text-accent font-bold">v1.0</span>
          </motion.div>
        )}
      </div>
    </motion.aside>
  )
}
