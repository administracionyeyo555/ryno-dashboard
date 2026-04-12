import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

// Mapeo de slugs a rutas de repositorios
const repoPathMap: Record<string, string> = {
  'caracas-golf-market': 'C:\\Users\\EQUIPO\\Desktop\\caracas-golf-market',
  'dabi': 'C:\\Users\\EQUIPO\\Desktop\\dabi',
  'flowmando-platform': 'C:\\Users\\EQUIPO\\Desktop\\flowmando-platform',
}

interface GitMetrics {
  commits: number | null
  files: number | null
  lines: string | null
}

async function getGitMetrics(repoPath: string): Promise<GitMetrics> {
  // Verificar que el directorio existe
  if (!fs.existsSync(repoPath)) {
    console.log(`[git-metrics] Directorio no existe: ${repoPath}`)
    return { commits: null, files: null, lines: null }
  }

  // Verificar que es un repo git
  const gitDir = path.join(repoPath, '.git')
  if (!fs.existsSync(gitDir)) {
    console.log(`[git-metrics] No es un repo git: ${repoPath}`)
    return { commits: null, files: null, lines: null }
  }

  let commits: number | null = null
  let files: number | null = null
  let lines: string | null = null

  // Contar commits totales
  try {
    const { stdout } = await execAsync('git rev-list --count HEAD', { cwd: repoPath })
    const parsed = parseInt(stdout.trim(), 10)
    if (!isNaN(parsed)) commits = parsed
  } catch (err) {
    console.log(`[git-metrics] Error contando commits en ${repoPath}:`, err)
  }

  // Contar archivos en el repo
  try {
    const { stdout } = await execAsync('git ls-files', { cwd: repoPath })
    const fileList = stdout.trim().split('\n').filter(Boolean)
    files = fileList.length
  } catch (err) {
    console.log(`[git-metrics] Error contando archivos en ${repoPath}:`, err)
  }

  // Contar lineas de codigo (archivos de codigo fuente)
  try {
    // Obtener lista de archivos de codigo
    const { stdout: codeFilesOut } = await execAsync(
      'git ls-files -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.css" "*.html"',
      { cwd: repoPath }
    )
    const codeFiles = codeFilesOut.trim().split('\n').filter(Boolean)

    if (codeFiles.length > 0) {
      // Intentar contar lineas reales usando wc -l (funciona con Git Bash en Windows)
      try {
        const { stdout: wcOut } = await execAsync(
          `git ls-files -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.css" "*.html" | xargs wc -l | tail -1`,
          { cwd: repoPath }
        )
        const totalMatch = wcOut.trim().match(/^\s*(\d+)/)
        if (totalMatch) {
          const totalLines = parseInt(totalMatch[1], 10)
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
  } catch (err) {
    console.log(`[git-metrics] Error contando lineas en ${repoPath}:`, err)
  }

  return { commits, files, lines }
}

export async function GET() {
  const metrics: Record<string, GitMetrics> = {}

  await Promise.all(
    Object.entries(repoPathMap).map(async ([slug, repoPath]) => {
      metrics[slug] = await getGitMetrics(repoPath)
    })
  )

  return NextResponse.json(metrics)
}
