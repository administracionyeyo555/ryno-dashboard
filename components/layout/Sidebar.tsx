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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/dashboard-store'
import { useSupabaseStatus } from '@/hooks/useSupabaseStatus'
import { getUser, logout, type AuthUser } from '@/lib/auth'

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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isSidebarCollapsed, toggleSidebar } = useDashboardStore()
  const { isConnected, isChecking, lastCheck } = useSupabaseStatus(30000)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Nombre de usuario mostrado (fallback a RYNOADMIN)
  const displayName = user?.displayName || 'RYNOADMIN'
  const username = user?.username || 'admin'
  const role = user?.role === 'admin' ? 'Administrador' : 'Usuario'

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-50"
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
