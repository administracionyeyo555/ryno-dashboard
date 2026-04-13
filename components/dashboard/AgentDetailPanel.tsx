'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Clock,
  FileCode,
  Wrench,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Terminal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plus,
  Minus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatDateTime, formatTime } from '@/lib/utils'
import type { AgentSession, AgentEvent } from '@/types/database'
import { springPhysics, accordionVariants } from '@/lib/animations'

interface AgentDetailPanelProps {
  session: AgentSession
  isOpen: boolean
  onClose: () => void
}

const eventTypeIcons: Record<string, React.ElementType> = {
  tool_use: Wrench,
  file_edit: FileCode,
  file_read: FileCode,
  error: AlertCircle,
  completion: CheckCircle,
  message: MessageSquare,
}

const eventTypeColors: Record<string, string> = {
  tool_use: 'text-accent bg-accent/10 border-accent/30',
  file_edit: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  file_read: 'text-muted bg-muted/10 border-muted/30',
  error: 'text-red-500 bg-red-500/10 border-red-500/30',
  completion: 'text-green-500 bg-green-500/10 border-green-500/30',
  message: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
}

function extractGitHubInfo(repoPath: string | undefined): { owner: string; repo: string } | null {
  if (!repoPath) return null
  const patterns = [/github\.com\/([^/]+)\/([^/]+)/, /^([^/]+)\/([^/]+)$/]
  for (const pattern of patterns) {
    const match = repoPath.match(pattern)
    if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
  }
  const segments = repoPath.split(/[/\\]/).filter(Boolean)
  if (segments.length >= 2) return { owner: segments[segments.length - 2], repo: segments[segments.length - 1] }
  return null
}

function SimpleDiff({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="font-mono text-xs bg-background/50 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
      {lines.map((line, index) => {
        const isAddition = line.startsWith('+') && !line.startsWith('+++')
        const isDeletion = line.startsWith('-') && !line.startsWith('---')
        const isHeader = line.startsWith('@@') || line.startsWith('diff') || line.startsWith('---') || line.startsWith('+++')
        return (
          <div key={index} className={cn('whitespace-pre', isAddition && 'bg-green-500/20 text-green-400', isDeletion && 'bg-red-500/20 text-red-400', isHeader && 'text-muted/70')}>
            {line || '\u00A0'}
          </div>
        )
      })}
    </div>
  )
}

interface EventAccordionItemProps {
  event: AgentEvent & { detail?: Record<string, unknown> | null }
  index: number
  gitHubInfo: { owner: string; repo: string } | null
}

function EventAccordionItem({ event, index, gitHubInfo }: EventAccordionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const IconComponent = eventTypeIcons[event.event_type] || Activity
  const colorClass = eventTypeColors[event.event_type] || 'text-muted bg-muted/10 border-muted/30'
  const detail = event.detail || {}
  const toolParams = detail.parameters || detail.params || detail.input || null
  const result = detail.result || detail.output || detail.response || null
  const diff = detail.diff || detail.changes || null
  const isWriteOrEdit = event.tool_name === 'Write' || event.tool_name === 'Edit'

  const truncate = (str: string, maxLen: number = 500) => {
    if (!str) return ''
    const strValue = typeof str === 'string' ? str : JSON.stringify(str, null, 2)
    return strValue.length <= maxLen ? strValue : strValue.substring(0, maxLen) + '...'
  }

  const githubUrl = gitHubInfo && event.file_path ? `https://github.com/${gitHubInfo.owner}/${gitHubInfo.repo}/blob/main/${event.file_path.replace(/^\//, '')}` : null

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="relative">
      {index > 0 && <div className="absolute left-5 -top-4 w-0.5 h-4 bg-border" />}
      <div className={cn('border rounded-xl overflow-hidden transition-all duration-200', isExpanded ? 'bg-card/80 border-accent/30' : 'bg-card/50 border-border hover:border-accent/20')}>
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center gap-3 p-4 text-left">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border', colorClass)}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted uppercase">{event.event_type.replace('_', ' ')}</span>
              {event.tool_name && <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">{event.tool_name}</span>}
            </div>
            {event.file_path && <p className="text-sm font-mono text-foreground/80 truncate">{event.file_path}</p>}
            {event.message && !event.file_path && <p className="text-sm text-muted line-clamp-1">{event.message}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-muted">{formatDateTime(event.timestamp)}</span>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-muted" />
            </motion.div>
          </div>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial="collapsed" animate="expanded" exit="collapsed" variants={accordionVariants} className="overflow-hidden">
              <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                {toolParams && (
                  <div>
                    <h4 className="text-xs font-medium text-muted uppercase mb-2 flex items-center gap-2"><ChevronRight className="w-3 h-3" />Parametros</h4>
                    <pre className="text-xs font-mono bg-background/50 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto text-foreground/80">{typeof toolParams === 'string' ? toolParams : JSON.stringify(toolParams, null, 2)}</pre>
                  </div>
                )}
                {result && (
                  <div>
                    <h4 className="text-xs font-medium text-muted uppercase mb-2 flex items-center gap-2"><ChevronRight className="w-3 h-3" />Resultado</h4>
                    <pre className="text-xs font-mono bg-background/50 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto text-foreground/80">{truncate(typeof result === 'string' ? result : JSON.stringify(result, null, 2))}</pre>
                  </div>
                )}
                {isWriteOrEdit && diff && (
                  <div>
                    <h4 className="text-xs font-medium text-muted uppercase mb-2 flex items-center gap-2"><Plus className="w-3 h-3 text-green-500" /><Minus className="w-3 h-3 text-red-500" />Cambios</h4>
                    <SimpleDiff content={typeof diff === 'string' ? diff : JSON.stringify(diff, null, 2)} />
                  </div>
                )}
                {githubUrl && (
                  <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors">
                    <ExternalLink className="w-4 h-4" />Ver en GitHub
                  </a>
                )}
                {event.message && (
                  <div>
                    <h4 className="text-xs font-medium text-muted uppercase mb-2 flex items-center gap-2"><MessageSquare className="w-3 h-3" />Mensaje</h4>
                    <p className="text-sm text-foreground/80 bg-background/50 rounded-lg p-3">{event.message}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function AgentDetailPanel({ session, isOpen, onClose }: AgentDetailPanelProps) {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase.from('agent_events').select('*').eq('session_id', session.id).order('timestamp', { ascending: false })
      if (fetchError) { setError(`Error al cargar los eventos: ${fetchError.message}`); setLoading(false); return }
      const transformedEvents = (data || []).map(event => ({ ...event, created_at: event.timestamp, metadata: event.detail, message: event.detail?.message || null }))
      setEvents(transformedEvents as AgentEvent[])
    } catch {
      setError('Error inesperado al cargar los eventos')
    } finally {
      setLoading(false)
    }
  }, [session.id])

  useEffect(() => { if (isOpen) fetchEvents() }, [isOpen, fetchEvents])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) { document.addEventListener('keydown', handleKeyDown); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = 'unset' }
  }, [isOpen, onClose])

  const runningTime = (() => {
    if (!session.started_at) return 0
    const start = new Date(session.started_at).getTime()
    const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now()
    return Math.floor((end - start) / 1000)
  })()

  const gitHubInfo = extractGitHubInfo((session.project as { repo_path?: string } | undefined)?.repo_path || session.project?.slug)
  const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
  const panelVariants = { hidden: { x: '100%' }, visible: { x: 0, transition: springPhysics.smooth }, exit: { x: '100%', transition: { duration: 0.25, ease: 'easeOut' as const } } }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div variants={panelVariants} initial="hidden" animate="visible" exit="exit" className="fixed top-0 right-0 h-full w-[500px] max-w-[90vw] bg-card border-l border-border shadow-2xl z-50 flex flex-col" style={{ width: 'min(500px, 40vw)' }}>
            <div className="flex items-center justify-between p-6 border-b border-border bg-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: session.project?.color ? `${session.project.color}20` : 'rgba(255, 107, 53, 0.1)' }}>
                  <Terminal className="w-6 h-6" style={{ color: session.project?.color || '#FF6B35' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{session.agent_name}</h2>
                  <p className="text-sm text-muted">{session.project?.name || 'Proyecto desconocido'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/10 transition-colors" aria-label="Cerrar panel"><X className="w-6 h-6 text-muted" /></button>
            </div>
            <div className="flex flex-wrap items-center gap-4 px-6 py-4 bg-background/50 border-b border-border">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /><span className="text-sm text-foreground"><strong>{formatTime(runningTime)}</strong></span></div>
              <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /><span className="text-sm text-foreground"><strong>{events.length}</strong> eventos</span></div>
              {session.current_tool && <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-accent" /><span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">{session.current_tool}</span></div>}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full"><Loader2 className="w-8 h-8 text-accent animate-spin mb-4" /><p className="text-muted">Cargando eventos...</p></div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full"><AlertCircle className="w-8 h-8 text-red-500 mb-4" /><p className="text-red-500 text-center">{error}</p><button onClick={fetchEvents} className="mt-4 px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors">Reintentar</button></div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full"><Activity className="w-12 h-12 text-muted/50 mb-4" /><p className="text-muted text-center">No hay eventos registrados para esta sesion</p></div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Timeline de Eventos</h3>
                  {events.map((event, index) => <EventAccordionItem key={event.id} event={event} index={index} gitHubInfo={gitHubInfo} />)}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
              <p className="text-sm text-muted">Iniciada: {formatDateTime(session.started_at)}</p>
              <button onClick={onClose} className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">Cerrar</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
