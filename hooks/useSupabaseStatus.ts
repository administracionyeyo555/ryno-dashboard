'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface SupabaseStatus {
  isConnected: boolean
  lastCheck: Date | null
  isChecking: boolean
  error: string | null
}

export function useSupabaseStatus(checkInterval: number = 30000) {
  const [status, setStatus] = useState<SupabaseStatus>({
    isConnected: false,
    lastCheck: null,
    isChecking: true,
    error: null,
  })

  const checkConnection = useCallback(async () => {
    setStatus((prev) => ({ ...prev, isChecking: true }))

    try {
      // Intentamos hacer una consulta simple para verificar la conexion
      const startTime = Date.now()
      const { error } = await supabase.from('projects').select('id').limit(1)
      const latency = Date.now() - startTime

      if (error) {
        // Si hay error pero es de permisos, aun asi estamos conectados
        if (error.code === 'PGRST116' || error.code === '42501') {
          setStatus({
            isConnected: true,
            lastCheck: new Date(),
            isChecking: false,
            error: null,
          })
        } else {
          setStatus({
            isConnected: false,
            lastCheck: new Date(),
            isChecking: false,
            error: error.message,
          })
        }
      } else {
        setStatus({
          isConnected: true,
          lastCheck: new Date(),
          isChecking: false,
          error: null,
        })
      }
    } catch (err) {
      setStatus({
        isConnected: false,
        lastCheck: new Date(),
        isChecking: false,
        error: err instanceof Error ? err.message : 'Error de conexion desconocido',
      })
    }
  }, [])

  useEffect(() => {
    // Check inmediato al montar
    checkConnection()

    // Configurar intervalo de chequeo
    const interval = setInterval(checkConnection, checkInterval)

    return () => clearInterval(interval)
  }, [checkConnection, checkInterval])

  return {
    ...status,
    refetch: checkConnection,
  }
}
