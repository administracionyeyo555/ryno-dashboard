'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuth, setIsAuth] = useState(false)

  // Rutas publicas que no requieren autenticacion
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setIsAuth(authenticated)
      setIsChecking(false)

      // Si no esta autenticado y no es ruta publica, redirigir a login
      if (!authenticated && !isPublicRoute) {
        router.push('/login')
      }

      // Si esta autenticado y esta en login, redirigir a monitor
      if (authenticated && isPublicRoute) {
        router.push('/monitor/live')
      }
    }

    checkAuth()
  }, [pathname, router, isPublicRoute])

  // Mostrar loading mientras verifica
  if (isChecking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-10 h-10 animate-spin"
            style={{ color: '#FF6B35' }}
          />
          <p className="text-gray-500 text-sm">Verificando sesion...</p>
        </div>
      </div>
    )
  }

  // Si es ruta publica, mostrar contenido sin importar auth
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Si no esta autenticado, no mostrar nada (se redirigira)
  if (!isAuth) {
    return null
  }

  // Si esta autenticado, mostrar contenido
  return <>{children}</>
}
