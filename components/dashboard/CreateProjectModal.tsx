'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Folder, Loader2, Palette } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const predefinedColors = [
  '#FF6B35', // Orange (RYNO)
  '#2D5016', // Green (Golf)
  '#7C3AED', // Purple (DABI)
  '#CC0000', // Red (ASOTOY)
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [color, setColor] = useState(predefinedColors[0])
  const [localPath, setLocalPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    // Generate slug: lowercase, replace spaces with hyphens, remove special chars
    const generatedSlug = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    setSlug(generatedSlug)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre del proyecto es requerido')
      return
    }

    if (!slug.trim()) {
      setError('El slug del proyecto es requerido')
      return
    }

    setLoading(true)

    try {
      // Insert into projects table
      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          color: color,
          active: true
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Ya existe un proyecto con ese slug')
        } else {
          setError(`Error al crear proyecto: ${insertError.message}`)
        }
        setLoading(false)
        return
      }

      // If local path provided, also insert initial metrics
      if (localPath.trim()) {
        await supabase
          .from('project_metrics')
          .upsert({
            project_slug: slug.trim(),
            commits: 0,
            files: 0,
            lines: 0,
            branch: 'main',
            uncommitted_files: 0,
            health_score: 50,
            updated_at: new Date().toISOString()
          }, { onConflict: 'project_slug' })
      }

      // Reset form
      setName('')
      setSlug('')
      setColor(predefinedColors[0])
      setLocalPath('')

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating project:', err)
      setError('Error inesperado al crear el proyecto')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-2xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Folder className="w-5 h-5" style={{ color }} />
                </div>
                <h2 className="text-xl font-bold text-foreground">Nuevo Proyecto</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-muted/10 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Mi Nuevo Proyecto"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={loading}
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Slug (identificador unico) *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="mi-nuevo-proyecto"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                  disabled={loading}
                />
                <p className="text-xs text-muted mt-1">
                  Se usa para identificar el proyecto en los hooks
                </p>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color del Proyecto
                </label>
                <div className="flex flex-wrap gap-2">
                  {predefinedColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {/* Local Path (optional) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ruta Local (opcional)
                </label>
                <input
                  type="text"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="C:\Users\EQUIPO\Desktop\mi-proyecto"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                  disabled={loading}
                />
                <p className="text-xs text-muted mt-1">
                  Para sincronizar metricas git, agrega la ruta en scripts/sync-metrics.js
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-muted/10 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim() || !slug.trim()}
                  className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Proyecto'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
