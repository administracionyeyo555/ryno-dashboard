'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface AgentNotification {
  id: string
  project_slug: string
  session_id: string | null
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

interface UseNotificationsOptions {
  limit?: number
  autoRefresh?: boolean
}

interface UseNotificationsReturn {
  notifications: AgentNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refetch: () => Promise<void>
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { limit = 20, autoRefresh = true } = options

  const [notifications, setNotifications] = useState<AgentNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calcular notificaciones no leidas
  const unreadCount = notifications.filter(n => !n.read).length

  // Fetch notificaciones
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('agent_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setNotifications(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar notificaciones'
      setError(errorMessage)
      console.error('useNotifications fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  // Marcar una notificacion como leida
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('agent_notifications')
        .update({ read: true })
        .eq('id', id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  // Marcar todas como leidas
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)

      if (unreadIds.length === 0) return

      const { error: updateError } = await supabase
        .from('agent_notifications')
        .update({ read: true })
        .in('id', unreadIds)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }, [notifications])

  // Fetch inicial
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Suscripcion realtime
  useEffect(() => {
    if (!autoRefresh) return

    let channel: RealtimeChannel | null = null

    const setupRealtime = async () => {
      channel = supabase
        .channel('agent_notifications_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_notifications'
          },
          (payload) => {
            // Agregar nueva notificacion al inicio
            const newNotification = payload.new as AgentNotification
            setNotifications(prev => [newNotification, ...prev.slice(0, limit - 1)])
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'agent_notifications'
          },
          (payload) => {
            // Actualizar notificacion existente
            const updatedNotification = payload.new as AgentNotification
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [autoRefresh, limit])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  }
}
