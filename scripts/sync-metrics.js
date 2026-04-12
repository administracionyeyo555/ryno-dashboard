#!/usr/bin/env node
/**
 * Git Metrics Sync - RYNO Studio
 *
 * Syncs local git repository metrics to Supabase.
 * Collects: commits, files, lines of code, last commit info, branch, uncommitted files.
 *
 * Usage:
 *   node scripts/sync-metrics.js
 *
 * Environment variables (from .env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ==============================================================================
// Configuration
// ==============================================================================

const PROJECTS = [
  { slug: 'caracas-golf-market', path: 'C:\\Users\\EQUIPO\\Desktop\\caracas-golf-market' },
  { slug: 'dabi', path: 'C:\\Users\\EQUIPO\\Desktop\\dabi' },
  { slug: 'flowmando-platform', path: 'C:\\Users\\EQUIPO\\Desktop\\flowmando-platform' },
  { slug: 'flowmando', path: 'C:\\Users\\EQUIPO\\Desktop\\flowmando' }
];

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase credentials.');
  console.error('Make sure .env.local contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ==============================================================================
// Git Commands
// ==============================================================================

/**
 * Execute a git command in a specific directory
 */
function git(projectPath, command) {
  try {
    const result = execSync(`git -C "${projectPath}" ${command}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });
    return result.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Check if directory is a git repository
 */
function isGitRepo(projectPath) {
  return git(projectPath, 'rev-parse --git-dir') !== null;
}

/**
 * Get total commits count
 */
function getCommitCount(projectPath) {
  const result = git(projectPath, 'rev-list --count HEAD');
  return result ? parseInt(result, 10) : 0;
}

/**
 * Get total files count
 */
function getFileCount(projectPath) {
  const result = git(projectPath, 'ls-files');
  if (!result) return 0;
  return result.split('\n').filter(line => line.trim()).length;
}

/**
 * Get total lines of code
 */
function getLinesOfCode(projectPath) {
  try {
    // Get list of tracked files
    const files = git(projectPath, 'ls-files');
    if (!files) return 0;

    const fileList = files.split('\n').filter(f => f.trim());
    let totalLines = 0;

    // Count lines for each file (skip binary files)
    for (const file of fileList) {
      const filePath = path.join(projectPath, file);

      // Skip if file doesn't exist or is binary
      if (!fs.existsSync(filePath)) continue;

      try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) continue;

        // Skip large files (likely binaries or generated)
        if (stats.size > 1024 * 1024) continue; // 1MB limit

        // Skip common binary extensions
        const ext = path.extname(file).toLowerCase();
        const binaryExtensions = [
          '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg',
          '.woff', '.woff2', '.ttf', '.eot', '.otf',
          '.pdf', '.zip', '.tar', '.gz', '.rar',
          '.mp3', '.mp4', '.wav', '.avi', '.mov',
          '.exe', '.dll', '.so', '.dylib',
          '.lock', '.bin'
        ];
        if (binaryExtensions.includes(ext)) continue;

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        totalLines += lines;
      } catch {
        // Skip files that can't be read
        continue;
      }
    }

    return totalLines;
  } catch {
    return 0;
  }
}

/**
 * Get last commit information
 */
function getLastCommit(projectPath) {
  const result = git(projectPath, 'log -1 --format="%s|%an|%ai"');

  if (!result) {
    return {
      message: null,
      author: null,
      date: null
    };
  }

  const [message, author, date] = result.split('|');

  return {
    message: message || null,
    author: author || null,
    date: date ? new Date(date).toISOString() : null
  };
}

/**
 * Get current branch name
 */
function getCurrentBranch(projectPath) {
  return git(projectPath, 'branch --show-current') || 'unknown';
}

/**
 * Get count of uncommitted files
 */
function getUncommittedFiles(projectPath) {
  const result = git(projectPath, 'status --porcelain');
  if (!result) return 0;
  return result.split('\n').filter(line => line.trim()).length;
}

/**
 * Calculate health score (0-100)
 */
function calculateHealthScore(metrics) {
  let score = 100;

  // Deduct for uncommitted files
  if (metrics.uncommitted_files > 0) {
    score -= Math.min(metrics.uncommitted_files * 5, 30);
  }

  // Deduct if on non-main branch with many uncommitted changes
  if (metrics.branch !== 'main' && metrics.branch !== 'master') {
    if (metrics.uncommitted_files > 5) {
      score -= 10;
    }
  }

  // Bonus for having commits
  if (metrics.commits > 0) {
    score = Math.max(score, 20);
  }

  // Deduct if last commit is old (more than 30 days)
  if (metrics.last_commit_date) {
    const lastCommitDate = new Date(metrics.last_commit_date);
    const daysSinceCommit = (Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCommit > 90) {
      score -= 20;
    } else if (daysSinceCommit > 30) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// ==============================================================================
// Collect Metrics
// ==============================================================================

/**
 * Collect all metrics for a project
 */
function collectMetrics(project) {
  console.log(`  Collecting metrics for ${project.slug}...`);

  if (!fs.existsSync(project.path)) {
    console.log(`    [SKIP] Directory does not exist: ${project.path}`);
    return null;
  }

  if (!isGitRepo(project.path)) {
    console.log(`    [SKIP] Not a git repository: ${project.path}`);
    return null;
  }

  const lastCommit = getLastCommit(project.path);

  const metrics = {
    project_slug: project.slug,
    commits: getCommitCount(project.path),
    files: getFileCount(project.path),
    lines: getLinesOfCode(project.path),
    last_commit_message: lastCommit.message,
    last_commit_author: lastCommit.author,
    last_commit_date: lastCommit.date,
    branch: getCurrentBranch(project.path),
    uncommitted_files: getUncommittedFiles(project.path),
    health_score: 0,
    updated_at: new Date().toISOString()
  };

  // Calculate health score
  metrics.health_score = calculateHealthScore(metrics);

  console.log(`    Commits: ${metrics.commits}`);
  console.log(`    Files: ${metrics.files}`);
  console.log(`    Lines: ${metrics.lines.toLocaleString()}`);
  console.log(`    Branch: ${metrics.branch}`);
  console.log(`    Uncommitted: ${metrics.uncommitted_files}`);
  console.log(`    Health Score: ${metrics.health_score}`);

  return metrics;
}

// ==============================================================================
// Supabase Integration
// ==============================================================================

/**
 * Upsert metrics to Supabase
 */
async function upsertMetrics(metrics) {
  const url = `${SUPABASE_URL}/rest/v1/project_metrics`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(metrics)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${response.status} - ${error}`);
  }

  return true;
}

// ==============================================================================
// Main
// ==============================================================================

async function main() {
  console.log('========================================');
  console.log('Git Metrics Sync - RYNO Studio');
  console.log('========================================');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const allMetrics = [];

  for (const project of PROJECTS) {
    const metrics = collectMetrics(project);
    if (metrics) {
      allMetrics.push(metrics);
    }
    console.log('');
  }

  if (allMetrics.length === 0) {
    console.log('No metrics collected. Exiting.');
    process.exit(0);
  }

  console.log('----------------------------------------');
  console.log('Syncing to Supabase...');
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const metrics of allMetrics) {
    try {
      await upsertMetrics(metrics);
      console.log(`  [OK] ${metrics.project_slug}`);
      successCount++;
    } catch (error) {
      console.error(`  [ERROR] ${metrics.project_slug}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('========================================');
  console.log(`Sync complete: ${successCount} success, ${errorCount} errors`);
  console.log('========================================');

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
