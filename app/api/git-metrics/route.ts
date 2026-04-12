import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

// Cliente Supabase para el servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mapeo de slugs a rutas de repositorios
const repoPathMap: Record<string, string> = {
  'caracas-golf-market': 'C:\\Users\\EQUIPO\\Desktop\\caracas-golf-market',
  'dabi': 'C:\\Users\\EQUIPO\\Desktop\\dabi',
  'flowmando-platform': 'C:\\Users\\EQUIPO\\Desktop\\flowmando-platform',
}

interface LastCommit {
  message: string
  timeAgo: string
  timestamp: Date | null
}

interface AgentSession {
  id: string
  started_at: string
  status: string
}

interface TaskStats {
  completed: number
  pending: number
}

type HealthStatus = 'green' | 'yellow' | 'red'

interface GitMetrics {
  // Git metrics
  commits: number | null
  files: number | null
  lines: string | null
  lastCommit: LastCommit | null
  currentBranch: string | null
  uncommittedFiles: number | null
  // Supabase metrics
  lastAgentSession: AgentSession | null
  taskStats: TaskStats
  healthStatus: HealthStatus
  healthScore: number
  lastActivityDaysAgo: number | null
}

async function runGitCommand(command: string, cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(command, { cwd, timeout: 10000 })
    return stdout.trim()
  } catch {
    return null
  }
}

function calculateHealthStatus(lastActivityDate: Date | null): { status: HealthStatus; score: number; daysAgo: number | null } {
  if (!lastActivityDate) {
    return { status: 'red', score: 0, daysAgo: null }
  }

  const now = new Date()
  const diffMs = now.getTime() - lastActivityDate.getTime()
  const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (daysAgo <= 2) {
    // Verde: actividad en ultimas 48 horas
    return { status: 'green', score: 100, daysAgo }
  } else if (daysAgo <= 7) {
    // Amarillo: 2-7 dias sin actividad
    return { status: 'yellow', score: 50, daysAgo }
  } else {
    // Rojo: +7 dias sin actividad
    return { status: 'red', score: Math.max(0, 25 - daysAgo), daysAgo }
  }
}

async function getSupabaseMetrics(slug: string): Promise<{
  lastAgentSession: AgentSession | null
  taskStats: TaskStats
}> {
  let lastAgentSession: AgentSession | null = null
  let taskStats: TaskStats = { completed: 0, pending: 0 }

  try {
    // Ultima sesion de agente para este proyecto
    const { data: sessionData } = await supabase
      .from('agent_sessions')
      .select('id, started_at, status')
      .eq('project_slug', slug)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionData) {
      lastAgentSession = sessionData
    }
  } catch (err) {
    console.log(`[git-metrics] Error fetching agent session for ${slug}:`, err)
  }

  try {
    // Tareas completadas
    const { count: completedCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_slug', slug)
      .eq('status', 'completed')

    // Tareas pendientes
    const { count: pendingCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_slug', slug)
      .in('status', ['pending', 'in_progress'])

    taskStats = {
      completed: completedCount || 0,
      pending: pendingCount || 0
    }
  } catch (err) {
    console.log(`[git-metrics] Error fetching tasks for ${slug}:`, err)
  }

  return { lastAgentSession, taskStats }
}

async function getGitMetrics(slug: string, repoPath: string): Promise<GitMetrics> {
  const defaultMetrics: GitMetrics = {
    commits: null,
    files: null,
    lines: null,
    lastCommit: null,
    currentBranch: null,
    uncommittedFiles: null,
    lastAgentSession: null,
    taskStats: { completed: 0, pending: 0 },
    healthStatus: 'red',
    healthScore: 0,
    lastActivityDaysAgo: null
  }

  // Verificar que el directorio existe
  if (!fs.existsSync(repoPath)) {
    console.log(`[git-metrics] Directorio no existe: ${repoPath}`)
    const supabaseData = await getSupabaseMetrics(slug)
    return { ...defaultMetrics, ...supabaseData }
  }

  // Verificar que es un repo git
  const gitDir = path.join(repoPath, '.git')
  if (!fs.existsSync(gitDir)) {
    console.log(`[git-metrics] No es un repo git: ${repoPath}`)
    const supabaseData = await getSupabaseMetrics(slug)
    return { ...defaultMetrics, ...supabaseData }
  }

  let lastCommit: LastCommit | null = null
  let commits: number | null = null
  let files: number | null = null
  let lines: string | null = null
  let currentBranch: string | null = null
  let uncommittedFiles: number | null = null
  let lastCommitTimestamp: Date | null = null

  // 1. Ultimo commit: mensaje y tiempo relativo
  const lastCommitOutput = await runGitCommand('git log -1 --pretty=format:"%s|%ar|%ci"', repoPath)
  if (lastCommitOutput) {
    const parts = lastCommitOutput.split('|')
    if (parts.length >= 3) {
      lastCommit = {
        message: parts[0].replace(/^"|"$/g, ''),
        timeAgo: parts[1]
      } as LastCommit
      // Parsear timestamp ISO para calcular health
      try {
        lastCommitTimestamp = new Date(parts[2])
        lastCommit.timestamp = lastCommitTimestamp
      } catch {
        lastCommit.timestamp = null
      }
    }
  }

  // 2. Rama activa
  currentBranch = await runGitCommand('git branch --show-current', repoPath)

  // 3. Archivos sin commitear
  const statusOutput = await runGitCommand('git status --porcelain', repoPath)
  if (statusOutput !== null) {
    const lines_arr = statusOutput.split('\n').filter(Boolean)
    uncommittedFiles = lines_arr.length
  }

  // 4. Total commits
  const commitsOutput = await runGitCommand('git rev-list --count HEAD', repoPath)
  if (commitsOutput) {
    const parsed = parseInt(commitsOutput, 10)
    if (!isNaN(parsed)) commits = parsed
  }

  // 5. Archivos totales
  const filesOutput = await runGitCommand('git ls-files', repoPath)
  if (filesOutput) {
    const fileList = filesOutput.split('\n').filter(Boolean)
    files = fileList.length
  }

  // 6. Lineas de codigo
  try {
    const codeFilesOut = await runGitCommand(
      'git ls-files -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.css" "*.html"',
      repoPath
    )
    if (codeFilesOut) {
      const codeFiles = codeFilesOut.split('\n').filter(Boolean)

      if (codeFiles.length > 0) {
        // Intentar contar lineas usando PowerShell en Windows
        try {
          const psCommand = `powershell -Command "(git ls-files -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.css' '*.html' | ForEach-Object { (Get-Content $_).Count } | Measure-Object -Sum).Sum"`
          const wcOutput = await runGitCommand(psCommand, repoPath)
          if (wcOutput) {
            const totalLines = parseInt(wcOutput, 10)
            if (!isNaN(totalLines) && totalLines > 0) {
              if (totalLines >= 1000) {
                lines = `${(totalLines / 1000).toFixed(1)}k`
              } else {
                lines = totalLines.toString()
              }
            }
          }
        } catch {
          // Fallback: estimar basado en numero de archivos (promedio ~50 lineas/archivo)
          const estimated = codeFiles.length * 50
          if (estimated >= 1000) {
            lines = `~${(estimated / 1000).toFixed(1)}k`
          } else if (estimated > 0) {
            lines = `~${estimated}`
          }
        }
      }
    }
  } catch (err) {
    console.log(`[git-metrics] Error contando lineas en ${repoPath}:`, err)
  }

  // Obtener datos de Supabase
  const supabaseData = await getSupabaseMetrics(slug)

  // Calcular health status basado en ultima actividad
  // Usamos el mas reciente entre: ultimo commit o ultima sesion de agente
  let lastActivity: Date | null = lastCommitTimestamp

  if (supabaseData.lastAgentSession?.started_at) {
    const sessionDate = new Date(supabaseData.lastAgentSession.started_at)
    if (!lastActivity || sessionDate > lastActivity) {
      lastActivity = sessionDate
    }
  }

  const healthInfo = calculateHealthStatus(lastActivity)

  return {
    commits,
    files,
    lines,
    lastCommit,
    currentBranch,
    uncommittedFiles,
    lastAgentSession: supabaseData.lastAgentSession,
    taskStats: supabaseData.taskStats,
    healthStatus: healthInfo.status,
    healthScore: healthInfo.score,
    lastActivityDaysAgo: healthInfo.daysAgo
  }
}

export async function GET() {
  const metrics: Record<string, GitMetrics> = {}

  await Promise.all(
    Object.entries(repoPathMap).map(async ([slug, repoPath]) => {
      metrics[slug] = await getGitMetrics(slug, repoPath)
    })
  )

  return NextResponse.json(metrics)
}
