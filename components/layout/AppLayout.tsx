'use client'

import { usePathname } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { GlobalMetricsBar } from '@/components/dashboard/GlobalMetricsBar'
import { useDashboardStore } from '@/stores/dashboard-store'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const { isSidebarCollapsed } = useDashboardStore()

  const noSidebarRoutes = ['/login']
  const showSidebar = !noSidebarRoutes.includes(pathname)
  const showGlobalMetrics = pathname.startsWith('/monitor') || pathname === '/'

  return (
    <AuthGuard>
      {showSidebar ? (
        <div className="flex min-h-screen">
          {/* Desktop Sidebar — hidden on mobile */}
          <Sidebar />

          <main
            className={cn(
              'flex-1 transition-all duration-300',
              // Desktop: offset by sidebar width
              isSidebarCollapsed ? 'md:ml-20' : 'md:ml-[260px]',
              // Mobile: no offset, but leave room for bottom nav
              'pb-16 md:pb-0'
            )}
          >
            {showGlobalMetrics && <GlobalMetricsBar />}
            {children}
          </main>

          {/* Mobile bottom navigation */}
          <MobileNav />
        </div>
      ) : (
        <>{children}</>
      )}
    </AuthGuard>
  )
}
