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
