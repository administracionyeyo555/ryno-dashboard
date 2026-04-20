'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(username, password)

    if (result.success) {
      router.push('/monitor/live')
    } else {
      setError(result.error || 'Error de autenticacion')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: '#FF6B35' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo RYNO */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1
            className="text-7xl font-bold tracking-tight mb-2"
            style={{ color: '#FF6B35' }}
          >
            RYNO
          </h1>
          <p className="text-gray-500 text-sm tracking-widest uppercase">
            Control Center
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-8"
          style={{
            backgroundColor: '#111111',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-400"
              >
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FF6B35'
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-400"
              >
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FF6B35'
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Ingresa tu contrasena"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#FF6B35',
                boxShadow: '0 4px 14px rgba(255, 107, 53, 0.4)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#e55a2b'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FF6B35'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-gray-600 text-xs"
        >
          Sistema de monitoreo RYNO v1.0
        </motion.p>
      </motion.div>
    </div>
  )
}
