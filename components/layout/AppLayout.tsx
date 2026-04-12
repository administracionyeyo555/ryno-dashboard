'use client'

import { usePathname } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { Sidebar } from '@/components/layout/Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()

  // Rutas sin sidebar (login y otras rutas publicas)
  const noSidebarRoutes = ['/login']
  const showSidebar = !noSidebarRoutes.includes(pathname)

  return (
    <AuthGuard>
      {showSidebar ? (
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[260px] transition-all duration-300">
            {children}
          </main>
        </div>
      ) : (
        <>{children}</>
      )}
    </AuthGuard>
  )
}
