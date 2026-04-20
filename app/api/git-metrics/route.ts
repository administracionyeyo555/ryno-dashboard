import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

// Detectar si estamos en Vercel
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.VERCEL_ENV

// Cliente Supabase para el servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mapeo de slugs a rutas de repositorios (solo usado localmente)
// Nota: Solo incluir proyectos que son repos git
const repoPathMap: Record<string, string> = {
  'caracas-golf-market': 'C:\\Users\\EQUIPO\\Desktop\\caracas-golf-market',
  'dabi': 'C:\\Users\\EQUIPO\\Desktop\\dabi',
  'flowmando-platform': 'C:\\Users\\EQUIPO\\Desktop\\flowmando-platform',
  // 'flowmando' no es un repo git - si lo inicializas, agregalo aqui
}

// Lista de todos los proyectos (usada en Vercel para saber que proyectos buscar)
const projectSlugs = Object.keys(repoPathMap)

interface CommitFile {
  path: string
  added: number
  deleted: number
}

interface LastCommit {
  message: string
  timeAgo: string
  timestamp: Date | null
  author?: string
  files?: CommitFile[]
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

// Interface para la tabla project_metrics en Supabase
interface ProjectMetricsRow {
  id?: string
  project_slug: string
  commits: number | null
  files: number | null
  lines: string | null
  last_commit_message: string | null
  last_commit_author: string | null
  last_commit_date: string | null
  last_commit_time_ago: string | null
  last_commit_files: CommitFile[] | null
  current_branch: string | null
  uncommitted_files: number | null
  health_status: HealthStatus
  health_score: number
  last_activity_days_ago: number | null
  updated_at?: string
}

// Guardar metricas git en Supabase (solo se ejecuta localmente)
async function saveMetricsToSupabase(slug: string, metrics: GitMetrics): Promise<void> {
  try {
    const row: Omit<ProjectMetricsRow, 'id' | 'updated_at'> = {
      project_slug: slug,
      commits: metrics.commits,
      files: metrics.files,
      lines: metrics.lines,
      last_commit_message: metrics.lastCommit?.message || null,
      last_commit_author: metrics.lastCommit?.author || null,
      last_commit_date: metrics.lastCommit?.timestamp?.toISOString() || null,
      last_commit_time_ago: metrics.lastCommit?.timeAgo || null,
      last_commit_files: metrics.lastCommit?.files || null,
      current_branch: metrics.currentBranch,
      uncommitted_files: metrics.uncommittedFiles,
      health_status: metrics.healthStatus,
      health_score: metrics.healthScore,
      last_activity_days_ago: metrics.lastActivityDaysAgo
    }

    const { error } = await supabase
      .from('project_metrics')
      .upsert(row, {
        onConflict: 'project_slug',
        ignoreDuplicates: false
      })

    if (error) {
      console.log(`[git-metrics] Error saving metrics for ${slug}:`, error.message)
    } else {
      console.log(`[git-metrics] Saved metrics for ${slug} to Supabase`)
    }
  } catch (err) {
    console.log(`[git-metrics] Exception saving metrics for ${slug}:`, err)
  }
}

// Obtener metricas desde Supabase (usado en Vercel)
async function getMetricsFromSupabase(slug: string): Promise<GitMetrics> {
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

  try {
    // Obtener metricas de git desde project_metrics
    const { data: metricsData, error } = await supabase
      .from('project_metrics')
      .select('*')
      .eq('project_slug', slug)
      .single()

    if (error || !metricsData) {
      console.log(`[git-metrics] No cached metrics found for ${slug}`)
      const supabaseData = await getSupabaseMetrics(slug)
      return { ...defaultMetrics, ...supabaseData }
    }

    // Reconstruir lastCommit
    let lastCommit: LastCommit | null = null
    if (metricsData.last_commit_message) {
      lastCommit = {
        message: metricsData.last_commit_message,
        timeAgo: metricsData.last_commit_time_ago || '',
        author: metricsData.last_commit_author || undefined,
        timestamp: metricsData.last_commit_date ? new Date(metricsData.last_commit_date) : null,
        files: metricsData.last_commit_files || []
      }
    }

    // Obtener datos adicionales de Supabase (sesiones, tareas)
    const supabaseData = await getSupabaseMetrics(slug)

    // Recalcular health status basado en datos actuales
    let lastActivity: Date | null = lastCommit?.timestamp || null
    if (supabaseData.lastAgentSession?.started_at) {
      const sessionDate = new Date(supabaseData.lastAgentSession.started_at)
      if (!lastActivity || sessionDate > lastActivity) {
        lastActivity = sessionDate
      }
    }
    const healthInfo = calculateHealthStatus(lastActivity)

    return {
      commits: metricsData.commits,
      files: metricsData.files,
      lines: metricsData.lines,
      lastCommit,
      currentBranch: metricsData.current_branch,
      uncommittedFiles: metricsData.uncommitted_files,
      lastAgentSession: supabaseData.lastAgentSession,
      taskStats: supabaseData.taskStats,
      healthStatus: healthInfo.status,
      healthScore: healthInfo.score,
      lastActivityDaysAgo: healthInfo.daysAgo
    }
  } catch (err) {
    console.log(`[git-metrics] Error fetching metrics from Supabase for ${slug}:`, err)
    const supabaseData = await getSupabaseMetrics(slug)
    return { ...defaultMetrics, ...supabaseData }
  }
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

  // 1. Ultimo commit: mensaje, autor, y tiempo relativo
  const lastCommitOutput = await runGitCommand('git log -1 --pretty=format:"%s|%an|%ar|%ci"', repoPath)
  if (lastCommitOutput) {
    const parts = lastCommitOutput.split('|')
    if (parts.length >= 4) {
      // Get files changed in last commit
      const commitFiles: CommitFile[] = []
      const numstatOutput = await runGitCommand('git log -1 --numstat --format=""', repoPath)
      if (numstatOutput) {
        const fileLines = numstatOutput.split('\n').filter(Boolean)
        for (const line of fileLines) {
          const fileParts = line.split('\t')
          if (fileParts.length >= 3) {
            commitFiles.push({
              path: fileParts[2],
              added: fileParts[0] === '-' ? 0 : parseInt(fileParts[0], 10) || 0,
              deleted: fileParts[1] === '-' ? 0 : parseInt(fileParts[1], 10) || 0
            })
          }
        }
      }

      lastCommit = {
        message: parts[0].replace(/^"|"$/g, ''),
        author: parts[1],
        timeAgo: parts[2],
        timestamp: null,
        files: commitFiles.slice(0, 10) // Max 10 files
      }
      // Parsear timestamp ISO para calcular health
      try {
        lastCommitTimestamp = new Date(parts[3])
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

  if (isVercel) {
    // En Vercel: obtener metricas desde Supabase
    console.log('[git-metrics] Running on Vercel - fetching from Supabase')
    await Promise.all(
      projectSlugs.map(async (slug) => {
        metrics[slug] = await getMetricsFromSupabase(slug)
      })
    )
  } else {
    // Localmente: leer desde git y guardar en Supabase
    console.log('[git-metrics] Running locally - reading from git repos')
    await Promise.all(
      Object.entries(repoPathMap).map(async ([slug, repoPath]) => {
        const gitMetrics = await getGitMetrics(slug, repoPath)
        metrics[slug] = gitMetrics

        // Guardar metricas en Supabase para que Vercel pueda leerlas
        await saveMetricsToSupabase(slug, gitMetrics)
      })
    )
  }

  return NextResponse.json(metrics)
}
