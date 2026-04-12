import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  // Tiempos en espanol
  if (diffInSeconds < 5) return 'ahora mismo'
  if (diffInSeconds < 60) return `hace ${diffInSeconds} segundos`

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes === 1) return 'hace 1 minuto'
  if (diffInMinutes < 60) return `hace ${diffInMinutes} minutos`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours === 1) return 'hace 1 hora'
  if (diffInHours < 24) return `hace ${diffInHours} horas`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'hace 1 dia'
  if (diffInDays < 7) return `hace ${diffInDays} dias`

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks === 1) return 'hace 1 semana'
  if (diffInWeeks < 4) return `hace ${diffInWeeks} semanas`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths === 1) return 'hace 1 mes'
  if (diffInMonths < 12) return `hace ${diffInMonths} meses`

  const diffInYears = Math.floor(diffInDays / 365)
  if (diffInYears === 1) return 'hace 1 ano'
  return `hace ${diffInYears} anos`
}

// Formato de tiempo relativo compacto (para uso en espacios reducidos)
export function formatRelativeTimeShort(date: Date | string): string {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) return 'ahora'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
  return `${Math.floor(diffInSeconds / 604800)}sem`
}

// Formato de fecha y hora completo
export function formatDateTime(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  return targetDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
