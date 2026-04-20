# Claude Code Hooks - Flowmando Integration

Este directorio contiene los hooks para integrar Claude Code con Flowmando, permitiendo el tracking automatico de sesiones y eventos del agente.

## Archivos

| Archivo | Descripcion |
|---------|-------------|
| `claude-hook.js` | Script Node.js que procesa eventos de Claude Code |
| `hooks-config.json` | Configuracion de hooks para copiar a settings.json |

## Requisitos

- Node.js 18+ (para usar `fetch` nativo)
- Claude Code CLI instalado
- Variables de entorno configuradas

## Instalacion

### 1. Configurar Variables de Entorno

**Windows (PowerShell):**
```powershell
$env:FLOWMANDO_PROJECT = "mi-proyecto"
$env:SUPABASE_URL = "https://xzkasvcqvddmgybzajeu.supabase.co"
$env:SUPABASE_ANON_KEY = "tu-clave-anonima"
```

**Windows (CMD):**
```cmd
set FLOWMANDO_PROJECT=mi-proyecto
set SUPABASE_URL=https://xzkasvcqvddmgybzajeu.supabase.co
set SUPABASE_ANON_KEY=tu-clave-anonima
```

**Mac/Linux (bash/zsh):**
```bash
export FLOWMANDO_PROJECT="mi-proyecto"
export SUPABASE_URL="https://xzkasvcqvddmgybzajeu.supabase.co"
export SUPABASE_ANON_KEY="tu-clave-anonima"
```

**Para persistir en Mac/Linux**, agrega al `~/.bashrc` o `~/.zshrc`:
```bash
export FLOWMANDO_PROJECT="mi-proyecto"
export SUPABASE_URL="https://xzkasvcqvddmgybzajeu.supabase.co"
export SUPABASE_ANON_KEY="tu-clave-anonima"
```

### 2. Agregar Hooks a Claude Code

Abre el archivo de configuracion de Claude Code:

**Windows:**
```
%APPDATA%\Claude\settings.json
```

**Mac:**
```
~/Library/Application Support/Claude/settings.json
```

**Linux:**
```
~/.config/claude/settings.json
```

Copia el contenido de `hooks-config.json` y agregalo a tu `settings.json`:

```json
{
  "existingSettings": "...",
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "node scripts/claude-hook.js"
      }
    ],
    "PostToolUse": [
      {
        "type": "command",
        "command": "node scripts/claude-hook.js",
        "matcher": "Write|Edit|Bash|Read"
      }
    ],
    "Stop": [
      {
        "type": "command",
        "command": "node scripts/claude-hook.js"
      }
    ]
  }
}
```

### 3. Verificar Instalacion

Ejecuta Claude Code en tu proyecto y verifica en Supabase que se estan creando registros en:
- `agent_sessions` - Sesiones del agente
- `agent_events` - Eventos de herramientas

## Eventos Capturados

| Evento | Tabla | Descripcion |
|--------|-------|-------------|
| SessionStart | agent_sessions | Cuando inicia una sesion de Claude |
| PostToolUse | agent_events | Despues de usar Write, Edit, Bash, Read |
| Stop | agent_sessions (update) | Cuando termina la sesion |

## Estructura de Datos

### agent_sessions
```json
{
  "session_id": "uuid",
  "project_slug": "mi-proyecto",
  "started_at": "2025-01-15T10:00:00Z",
  "stopped_at": "2025-01-15T10:30:00Z",
  "cwd": "/path/to/project",
  "metadata": {
    "platform": "win32",
    "node_version": "v20.0.0",
    "hook_version": "1.0.0"
  }
}
```

### agent_events
```json
{
  "session_id": "uuid",
  "project_slug": "mi-proyecto",
  "event_type": "tool_use",
  "tool_name": "Write",
  "timestamp": "2025-01-15T10:05:00Z",
  "payload": {
    "input": { "file_path": "...", "content": "..." },
    "result": { "success": true },
    "success": true
  }
}
```

## Notas Importantes

1. **Silencioso por diseno**: El hook NUNCA falla ni interrumpe Claude Code. Todos los errores son capturados silenciosamente.

2. **Timeout**: Hay un timeout de 5 segundos para lectura de stdin y 10 segundos para llamadas a Supabase.

3. **Truncamiento**: Los payloads grandes (>5000 caracteres) se truncan automaticamente.

4. **Compatibilidad**: Funciona en Windows, Mac y Linux.

## Troubleshooting

### El hook no esta enviando datos

1. Verifica que las variables de entorno estan configuradas
2. Verifica que Node.js 18+ esta instalado: `node --version`
3. Prueba manualmente:
   ```bash
   echo '{"type":"SessionStart","session_id":"test-123"}' | node scripts/claude-hook.js
   ```

### Errores de permisos

En Mac/Linux, asegurate que el script es ejecutable:
```bash
chmod +x scripts/claude-hook.js
```

## Soporte

Para reportar problemas o sugerencias, contacta al equipo de Flowmando.

---

# Git Metrics Sync

Script para sincronizar metricas de repositorios git locales a Supabase.

## Archivos

| Archivo | Descripcion |
|---------|-------------|
| `sync-metrics.js` | Script Node.js que recolecta metricas git y las envia a Supabase |
| `sync-metrics.bat` | Script batch para Windows Task Scheduler |
| `project_metrics.sql` | SQL para crear la tabla en Supabase |

## Metricas Recolectadas

Para cada proyecto:
- **commits**: Total de commits (`git rev-list --count HEAD`)
- **files**: Total de archivos trackeados (`git ls-files`)
- **lines**: Lineas de codigo (suma de todas las lineas de archivos no-binarios)
- **last_commit_message**: Mensaje del ultimo commit
- **last_commit_author**: Autor del ultimo commit
- **last_commit_date**: Fecha del ultimo commit
- **branch**: Branch actual (`git branch --show-current`)
- **uncommitted_files**: Archivos con cambios sin commit (`git status --porcelain`)
- **health_score**: Puntuacion de salud calculada (0-100)

## Proyectos Monitoreados

| Slug | Path |
|------|------|
| caracas-golf-market | `C:\Users\EQUIPO\Desktop\caracas-golf-market` |
| dabi | `C:\Users\EQUIPO\Desktop\dabi` |
| flowmando-platform | `C:\Users\EQUIPO\Desktop\flowmando-platform` |
| flowmando | `C:\Users\EQUIPO\Desktop\flowmando` |

## Instalacion

### 1. Crear la tabla en Supabase

1. Abre el SQL Editor de Supabase: https://supabase.com/dashboard/project/xzkasvcqvddmgybzajeu/sql/new
2. Copia y ejecuta el contenido de `project_metrics.sql`
3. Verifica que la tabla `project_metrics` fue creada

### 2. Verificar credenciales

Asegurate que `.env.local` en la raiz del proyecto contiene:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xzkasvcqvddmgybzajeu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### 3. Ejecutar manualmente

```bash
# Desde la raiz del proyecto
node scripts/sync-metrics.js
```

Salida esperada:
```
========================================
Git Metrics Sync - RYNO Studio
========================================
Time: 2026-04-12T20:00:00.000Z
Supabase URL: https://xzkasvcqvddmgybzajeu.supabase.co

  Collecting metrics for caracas-golf-market...
    Commits: 31
    Files: 113
    Lines: 27,529
    Branch: main
    Uncommitted: 9
    Health Score: 70

  ...

----------------------------------------
Syncing to Supabase...

  [OK] caracas-golf-market
  [OK] dabi
  [OK] flowmando-platform

========================================
Sync complete: 3 success, 0 errors
========================================
```

## Automatizacion con Windows Task Scheduler

### Opcion 1: Usando el archivo .bat

1. Abre **Task Scheduler** (Programador de tareas)
2. Click en **Create Basic Task...**
3. Nombre: `Git Metrics Sync`
4. Descripcion: `Sincroniza metricas de git a Supabase`
5. Trigger: **Daily** o la frecuencia deseada
6. Action: **Start a program**
   - Program: `C:\Users\EQUIPO\Documents\CEREBRO FLOWMANDO 3\scripts\sync-metrics.bat`
   - Start in: `C:\Users\EQUIPO\Documents\CEREBRO FLOWMANDO 3`
7. Finalizar

### Opcion 2: Ejecutando Node directamente

1. Abre **Task Scheduler** (Programador de tareas)
2. Click en **Create Task...** (para mas opciones)
3. General:
   - Nombre: `Git Metrics Sync`
   - Run whether user is logged on or not (opcional)
4. Triggers:
   - New... -> Daily, cada 1 dia, repetir cada 6 horas (por ejemplo)
5. Actions:
   - New...
   - Action: Start a program
   - Program/script: `node`
   - Arguments: `scripts\sync-metrics.js`
   - Start in: `C:\Users\EQUIPO\Documents\CEREBRO FLOWMANDO 3`
6. Conditions: Desmarcar "Start only if the computer is on AC power" si es laptop
7. OK

### Verificar que funciona

1. En Task Scheduler, click derecho en la tarea -> **Run**
2. Verifica los logs en `logs/sync-metrics-*.log`
3. Verifica los datos en Supabase

## Health Score

La puntuacion de salud se calcula asi:

| Factor | Impacto |
|--------|---------|
| Base | 100 puntos |
| Archivos sin commit | -5 puntos por archivo (max -30) |
| Branch no-main con muchos cambios | -10 puntos |
| Ultimo commit > 30 dias | -10 puntos |
| Ultimo commit > 90 dias | -20 puntos |
| Minimo si hay commits | 20 puntos |

## Troubleshooting

### Error: "Missing Supabase credentials"

Verifica que `.env.local` existe y contiene las credenciales correctas.

### Error: "Could not find the table 'project_metrics'"

Ejecuta el SQL de `project_metrics.sql` en Supabase.

### Error: "Not a git repository"

El directorio no es un repositorio git. Inicializalo con `git init` o verificalo.

### El script tarda mucho

El conteo de lineas puede tardar en proyectos grandes. Los archivos > 1MB y binarios se saltan automaticamente.
