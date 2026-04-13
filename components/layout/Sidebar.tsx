'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Folder,
  Clock,
  CheckSquare,
  ChevronLeft,
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
import {
  springPhysics,
  staggerContainerVariants,
  slideIndicatorVariants,
} from '@/lib/animations'

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

// Glitch effect component for logo
function GlitchLogo({ children, isHovered }: { children: React.ReactNode; isHovered: boolean }) {
  return (
    <div className="relative">
      {/* Main content */}
      <div className="relative z-10">{children}</div>

      {/* Glitch layers */}
      <AnimatePresence>
        {isHovered && (
          <>
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ x: 0, opacity: 0 }}
              animate={{
                x: [0, -2, 2, -1, 1, 0],
                opacity: [0, 0.7, 0.7, 0.7, 0.7, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.3,
                times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                ease: 'linear'
              }}
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
                filter: 'hue-rotate(90deg)',
              }}
            >
              {children}
            </motion.div>
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ x: 0, opacity: 0 }}
              animate={{
                x: [0, 2, -2, 1, -1, 0],
                opacity: [0, 0.7, 0.7, 0.7, 0.7, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.3,
                times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                ease: 'linear'
              }}
              style={{
                clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
                filter: 'hue-rotate(-90deg)',
              }}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Nav item with spring hover indicator
function NavItem({
  item,
  isActive,
  isCollapsed,
  index,
  hoveredIndex,
  setHoveredIndex,
}: {
  item: typeof navItems[0]
  isActive: boolean
  isCollapsed: boolean
  index: number
  hoveredIndex: number | null
  setHoveredIndex: (index: number | null) => void
}) {
  const Icon = item.icon
  const isHovered = hoveredIndex === index

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      className="relative"
    >
      <Link
        href={item.href}
        className={cn(
          'nav-item group relative',
          isActive && 'active',
          isCollapsed && 'justify-center px-0'
        )}
        title={isCollapsed ? item.name : undefined}
        style={{ borderRadius: '10px' }}
      >
        {/* Hover background effect with spring */}
        <AnimatePresence>
          {isHovered && !isActive && (
            <motion.div
              className="absolute inset-0 bg-card rounded-[10px]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springPhysics.snappy}
            />
          )}
        </AnimatePresence>

        {/* Icon with glow on active */}
        <motion.div
          className={cn(
            'relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 z-10',
            isActive ? 'bg-accent/20' : 'bg-transparent group-hover:bg-card'
          )}
          animate={{
            scale: isHovered || isActive ? 1.05 : 1,
          }}
          transition={springPhysics.snappy}
        >
          <motion.div
            animate={{
              rotate: isHovered && !isActive ? [0, -5, 5, 0] : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <Icon
              className={cn(
                'w-[18px] h-[18px] transition-colors duration-200',
                isActive ? 'text-accent' : 'text-muted group-hover:text-foreground'
              )}
            />
          </motion.div>
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{
                boxShadow: '0 0 12px var(--accent-glow)',
              }}
              layoutId="navIconGlow"
            />
          )}
        </motion.div>

        {/* Text content with slide */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 z-10"
            >
              <span
                className={cn(
                  'font-semibold text-sm tracking-tight transition-colors duration-200',
                  isActive ? 'text-foreground' : 'text-muted group-hover:text-foreground'
                )}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {item.name}
              </span>
              <span
                className="text-[11px] text-muted/70"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {item.description}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active indicator bar with spring physics */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="activeNavBar"
              className="absolute left-0 w-[3px] h-7 rounded-r-full"
              style={{
                background: 'linear-gradient(180deg, var(--accent) 0%, #ff5722 100%)',
                boxShadow: '0 0 8px var(--accent)',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={springPhysics.bouncy}
            />
          )}
        </AnimatePresence>

        {/* Hover slide indicator */}
        <AnimatePresence>
          {isHovered && !isActive && (
            <motion.div
              className="absolute left-0 w-[2px] h-5 bg-accent/50 rounded-r-full"
              variants={slideIndicatorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isSidebarCollapsed, toggleSidebar } = useDashboardStore()
  const { isConnected, isChecking, lastCheck } = useSupabaseStatus(30000)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isLogoHovered, setIsLogoHovered] = useState(false)

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
      animate={{ width: isSidebarCollapsed ? 80 : 280 }}
      transition={springPhysics.smooth}
      className="fixed left-0 top-0 h-screen flex flex-col z-50"
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #111111 100%)',
        borderRight: '1px solid var(--border)',
        boxShadow: '4px 0 24px -4px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 107, 53, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 53, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Logo Section with Glitch Effect */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-border relative">
        <Link
          href="/monitor/live"
          className="flex items-center gap-3 group"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
        >
          {/* Logo mark with glow */}
          <motion.div
            className="relative w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #ff5722 100%)',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springPhysics.snappy}
          >
            <Brain className="w-6 h-6 text-white" />
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />

            {/* Pulse effect on hover */}
            <AnimatePresence>
              {isLogoHovered && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.2, 1.2] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <GlitchLogo isHovered={isLogoHovered}>
                  <span
                    className="text-2xl font-bold tracking-tight"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: 'linear-gradient(135deg, var(--accent) 0%, #ff8554 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 30px var(--accent-glow)',
                    }}
                  >
                    RYNO
                  </span>
                </GlitchLogo>
                <span
                  className="text-[11px] text-muted tracking-widest uppercase -mt-0.5"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  STUDIO
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <motion.button
          onClick={toggleSidebar}
          className="p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-border hover:bg-card"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div
            animate={{ rotate: isSidebarCollapsed ? 180 : 0 }}
            transition={springPhysics.bouncy}
          >
            <ChevronLeft className="w-4 h-4 text-muted" />
          </motion.div>
        </motion.button>
      </div>

      {/* Navigation with stagger animation */}
      <motion.nav
        className="flex-1 py-6 px-3 space-y-1.5 relative"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Section label */}
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="px-3 text-[10px] font-semibold text-muted uppercase tracking-widest mb-3 block"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Monitor
            </motion.span>
          )}
        </AnimatePresence>

        {navItems.map((item, index) => {
          const isActive = pathname === item.href
          return (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive}
              isCollapsed={isSidebarCollapsed}
              index={index}
              hoveredIndex={hoveredIndex}
              setHoveredIndex={setHoveredIndex}
            />
          )
        })}
      </motion.nav>

      {/* Notifications Button */}
      <div className="px-3 pb-2 notifications-dropdown relative">
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            setIsNotificationsOpen(!isNotificationsOpen)
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-background/50',
            isSidebarCollapsed && 'justify-center px-0'
          )}
          title={isSidebarCollapsed ? `Notificaciones (${unreadCount})` : undefined}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <Bell className={cn(
              'w-5 h-5',
              unreadCount > 0 ? 'text-accent' : 'text-muted'
            )} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={springPhysics.bouncy}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-error text-[10px] text-white font-bold rounded-full flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col flex-1"
              >
                <span className="font-medium text-sm">Notificaciones</span>
                <span className="text-xs text-muted">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : 'Sin notificaciones'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {isNotificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={springPhysics.snappy}
              className={cn(
                'absolute bottom-full mb-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-[100]',
                isSidebarCollapsed ? 'left-full ml-2 w-80' : 'left-0 w-full'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
                <span className="font-semibold text-sm">Notificaciones</span>
                {unreadCount > 0 && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      markAllAsRead()
                    }}
                    className="text-xs text-accent hover:text-accent/80 flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CheckCheck className="w-3 h-3" />
                    Marcar todas
                  </motion.button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-64 overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted">
                    <Bell className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm">Sin notificaciones</span>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
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
                        <motion.div
                          className="shrink-0"
                          animate={{
                            scale: [1, 1.02, 1],
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut' as const,
                          }}
                        >
                          <span className="w-2 h-2 rounded-full bg-accent block" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Supabase Connection Status */}
      <div className="px-3 pb-2">
        <motion.div
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
          initial={false}
          animate={{
            borderColor: isConnected
              ? 'rgba(34, 197, 94, 0.2)'
              : 'rgba(239, 68, 68, 0.2)',
          }}
        >
          <div className="relative">
            <Database
              className={cn(
                'w-5 h-5',
                isConnected ? 'text-success' : 'text-error'
              )}
            />
            {/* Indicador de estado pulsante */}
            <motion.span
              className={cn(
                'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card',
                isConnected ? 'bg-success' : 'bg-error'
              )}
              animate={isChecking ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1, repeat: isChecking ? Infinity : 0 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
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
          </AnimatePresence>
        </motion.div>
      </div>

      {/* User Section */}
      <div className="px-3 pb-2">
        <motion.div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20',
            isSidebarCollapsed && 'justify-center px-0'
          )}
          whileHover={{ borderColor: 'rgba(255, 107, 53, 0.4)' }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative shrink-0">
            <motion.div
              className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              transition={springPhysics.snappy}
            >
              <User className="w-4 h-4 text-accent" />
            </motion.div>
            {/* Online indicator */}
            <motion.span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
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
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <LogOut className="w-4 h-4 text-muted group-hover:text-error transition-colors" />
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer with Version */}
      <div className="p-4 border-t border-border">
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed ? (
            <motion.div
              key="expanded"
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
                  animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[10px] text-muted">Activo</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
              title="RYNO Studio v1.0.0"
            >
              <span className="text-[10px] text-accent font-bold">v1.0</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
