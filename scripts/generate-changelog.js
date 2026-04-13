#!/usr/bin/env node
/**
 * Generate Changelog - RYNO Studio
 * Generates changelog entries from commit info and saves to Supabase.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECTS_MAP = {
  'asotoy': 'C:\\Users\\EQUIPO\\Desktop\\asotoy',
  'caracas-golf-market': 'C:\\Users\\EQUIPO\\Desktop\\caracas-golf-market',
  'dabi': 'C:\\Users\\EQUIPO\\Desktop\\dabi',
  'flowmando-platform': 'C:\\Users\\EQUIPO\\Documents\\CEREBRO FLOWMANDO 3',
  'cerebro-flowmando': 'C:\\Users\\EQUIPO\\Documents\\CEREBRO FLOWMANDO 3',
};

const CHANGE_CATEGORIES = {
  'feat': ['feature', 'add', 'new', 'implement'],
  'fix': ['fix', 'bug', 'patch', 'resolve', 'issue'],
  'refactor': ['refactor', 'clean', 'improve', 'optimize'],
  'style': ['style', 'css', 'ui', 'design', 'format'],
  'docs': ['doc', 'readme', 'comment'],
  'test': ['test', 'spec', 'e2e'],
  'chore': ['chore', 'deps', 'update', 'upgrade', 'bump'],
};

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length) process.env[key] = valueParts.join('=');
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function parseArgs() {
  const args = { project: process.env.PROJECT_SLUG || null, hash: process.env.COMMIT_HASH || null, count: 1, help: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg.startsWith('--project=')) args.project = arg.split('=')[1];
    else if (arg.startsWith('--hash=')) args.hash = arg.split('=')[1];
    else if (arg.startsWith('--count=')) args.count = parseInt(arg.split('=')[1], 10) || 1;
  }
  return args;
}

function git(projectPath, command) {
  try {
    return execSync(`git -C "${projectPath}" ${command}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }).trim();
  } catch { return null; }
}

function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const typeMap = { '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript', '.css': 'styles', '.scss': 'styles', '.json': 'config', '.md': 'docs', '.sql': 'database' };
  return typeMap[ext] || 'other';
}

function getCommitInfo(projectPath, commitHash = 'HEAD') {
  const format = git(projectPath, `log -1 ${commitHash} --format="%H|%s|%an|%ae|%ai"`);
  if (!format) return null;
  const [hash, message, authorName, authorEmail, date] = format.split('|');
  const numstat = git(projectPath, `log -1 ${commitHash} --numstat --format=""`);
  const files = [];
  if (numstat) {
    for (const line of numstat.split('\n').filter(l => l.trim())) {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        files.push({ path: parts[2], added: parts[0] === '-' ? 0 : parseInt(parts[0], 10) || 0, deleted: parts[1] === '-' ? 0 : parseInt(parts[1], 10) || 0, type: getFileType(parts[2]) });
      }
    }
  }
  return { hash, message, author: authorName, authorEmail, date: new Date(date).toISOString(), files };
}

function getRecentCommits(projectPath, count = 1) {
  const hashes = git(projectPath, `log -${count} --format="%H"`);
  if (!hashes) return [];
  return hashes.split('\n').filter(h => h.trim()).map(hash => getCommitInfo(projectPath, hash)).filter(Boolean);
}

function categorizeCommit(message) {
  const lowerMessage = message.toLowerCase();
  const conventionalMatch = lowerMessage.match(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:/);
  if (conventionalMatch) return conventionalMatch[1];
  for (const [category, keywords] of Object.entries(CHANGE_CATEGORIES)) {
    for (const keyword of keywords) { if (lowerMessage.includes(keyword)) return category; }
  }
  return 'chore';
}

function generateSummary(commit) {
  const category = categorizeCommit(commit.message);
  const fileTypes = [...new Set(commit.files.map(f => f.type))];
  const totalAdded = commit.files.reduce((sum, f) => sum + f.added, 0);
  const totalDeleted = commit.files.reduce((sum, f) => sum + f.deleted, 0);
  const parts = [];
  const categoryLabels = { feat: 'Nueva funcionalidad', fix: 'Correccion de bug', refactor: 'Refactorizacion', style: 'Cambios de estilo', docs: 'Documentacion', test: 'Tests', chore: 'Mantenimiento' };
  parts.push(categoryLabels[category] || 'Cambio');
  const typeLabels = { typescript: 'TypeScript', javascript: 'JavaScript', styles: 'estilos', config: 'configuracion', docs: 'documentacion', database: 'base de datos' };
  const labels = fileTypes.map(t => typeLabels[t]).filter(Boolean).slice(0, 3);
  if (labels.length > 0) parts.push(`en ${labels.join(', ')}`);
  if (totalAdded > 0 || totalDeleted > 0) {
    const stats = [];
    if (totalAdded > 0) stats.push(`+${totalAdded}`);
    if (totalDeleted > 0) stats.push(`-${totalDeleted}`);
    parts.push(`(${stats.join('/')} lineas)`);
  }
  return parts.join(' ');
}

async function insertChangelog(entry) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/project_changelog`, {
    method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(entry)
  });
  if (!response.ok) throw new Error(`Supabase error: ${response.status} - ${await response.text()}`);
  return true;
}

async function checkDuplicate(projectSlug, commitHash) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/project_changelog?project_slug=eq.${projectSlug}&commit_hash=eq.${commitHash}&select=id`, {
    method: 'GET', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!response.ok) return false;
  return (await response.json()).length > 0;
}

async function main() {
  const args = parseArgs();
  if (args.help) { console.log('Usage: node generate-changelog.js --project=<slug> [--hash=<hash>] [--count=<n>]'); process.exit(0); }
  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Error: Missing Supabase credentials.'); process.exit(1); }
  if (!args.project) { console.error('Error: Project slug is required.'); process.exit(1); }
  const projectPath = PROJECTS_MAP[args.project];
  if (!projectPath || !fs.existsSync(projectPath)) { console.error(`Error: Unknown or missing project "${args.project}".`); process.exit(1); }
  console.log(`\nGenerate Changelog - ${args.project}\n`);
  const commits = args.hash ? [getCommitInfo(projectPath, args.hash)].filter(Boolean) : getRecentCommits(projectPath, args.count);
  if (commits.length === 0) { console.log('No commits found.'); process.exit(0); }
  let success = 0, skip = 0, errors = 0;
  for (const commit of commits) {
    console.log(`[${commit.hash.substring(0, 7)}] ${commit.message.substring(0, 50)}...`);
    if (await checkDuplicate(args.project, commit.hash)) { console.log('  -> Skipped'); skip++; continue; }
    const entry = { project_slug: args.project, commit_hash: commit.hash, commit_message: commit.message, summary: generateSummary(commit), files_changed: commit.files, author: commit.author, created_at: commit.date };
    try { await insertChangelog(entry); console.log(`  -> Added`); success++; } catch (e) { console.error(`  -> Error: ${e.message}`); errors++; }
  }
  console.log(`\nComplete: ${success} added, ${skip} skipped, ${errors} errors\n`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
