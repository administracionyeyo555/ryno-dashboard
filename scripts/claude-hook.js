#!/usr/bin/env node
/**
 * Claude Code Hook - RYNO Studio Integration
 *
 * Este script captura eventos de Claude Code y los envía a Supabase.
 * Diseñado para NUNCA fallar ni interrumpir Claude Code.
 *
 * Eventos soportados:
 * - SessionStart: Inicio de sesión de agente
 * - PostToolUse: Después de usar una herramienta (Write, Edit, Bash, Read)
 * - Stop: Fin de sesión
 *
 * Variables de entorno requeridas:
 * - FLOWMANDO_PROJECT: Slug del proyecto
 * - SUPABASE_URL: URL de Supabase
 * - SUPABASE_ANON_KEY: Clave anónima de Supabase
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xzkasvcqvddmgybzajeu.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_HSS4nyz3z9H5dzMRJgtHog_pNiXp0At';
const FLOWMANDO_PROJECT = process.env.FLOWMANDO_PROJECT || 'cerebro-flowmando';

/**
 * Lee todo el stdin y parsea como JSON
 */
async function readStdin() {
  return new Promise((resolve) => {
    let data = '';

    // Timeout de 5 segundos para no bloquear
    const timeout = setTimeout(() => {
      resolve(null);
    }, 5000);

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      clearTimeout(timeout);
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });

    process.stdin.on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });

    // Iniciar lectura
    process.stdin.resume();
  });
}

/**
 * Envía datos a Supabase de forma silenciosa
 */
async function supabaseRequest(endpoint, method, body) {
  if (!SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000) // 10 segundos timeout
    });

    if (method === 'POST' && response.ok) {
      const result = await response.json();
      return result?.[0] || null;
    }

    return response.ok;
  } catch {
    // Silencioso - nunca falla
    return null;
  }
}

/**
 * Maneja el evento SessionStart
 */
async function handleSessionStart(event) {
  const sessionId = event.session_id || event.sessionId;

  if (!sessionId || !FLOWMANDO_PROJECT) {
    return;
  }

  await supabaseRequest('agent_sessions', 'POST', {
    id: sessionId,
    project_slug: FLOWMANDO_PROJECT,
    agent_name: 'claude-code',
    status: 'active',
    started_at: new Date().toISOString()
  });
}

/**
 * Maneja el evento PostToolUse
 */
async function handlePostToolUse(event) {
  const sessionId = event.session_id || event.sessionId;
  const toolName = event.tool_name || event.toolName || event.tool;

  if (!sessionId) {
    return;
  }

  // Extraer información del resultado
  const toolInput = event.tool_input || event.input || {};
  const toolResult = event.tool_result || event.result || {};

  // Extraer file_path de multiples posibles ubicaciones
  const filePath = toolInput.file_path || toolInput.path || toolInput.notebook_path || null;

  await supabaseRequest('agent_events', 'POST', {
    session_id: sessionId,
    event_type: 'tool_use',
    tool_name: toolName,
    file_path: filePath,
    detail: sanitizePayload({
      input_summary: toolInput,
      success: !toolResult.error,
      project_slug: FLOWMANDO_PROJECT
    }),
    timestamp: new Date().toISOString()
  });
}

/**
 * Maneja el evento Stop
 */
async function handleStop(event) {
  const sessionId = event.session_id || event.sessionId;

  if (!sessionId) {
    return;
  }

  // Actualizar la sesión con la hora de finalización
  await supabaseRequest(
    `agent_sessions?id=eq.${sessionId}`,
    'PATCH',
    {
      status: 'stopped',
      stopped_at: new Date().toISOString()
    }
  );
}

/**
 * Limpia y limita el tamaño del payload para evitar problemas
 */
function sanitizePayload(obj, maxLength = 5000) {
  if (!obj) return null;

  try {
    let str = JSON.stringify(obj);

    // Limitar tamaño
    if (str.length > maxLength) {
      return {
        _truncated: true,
        _original_size: str.length,
        preview: str.substring(0, maxLength)
      };
    }

    return obj;
  } catch {
    return { _error: 'Unable to serialize' };
  }
}

/**
 * Punto de entrada principal
 */
async function main() {
  try {
    const event = await readStdin();

    if (!event) {
      process.exit(0);
    }

    // Determinar el tipo de evento
    const eventType = event.type || event.event_type || event.hook;

    switch (eventType) {
      case 'SessionStart':
      case 'session_start':
        await handleSessionStart(event);
        break;

      case 'PostToolUse':
      case 'post_tool_use':
      case 'tool_use':
        await handlePostToolUse(event);
        break;

      case 'Stop':
      case 'stop':
      case 'session_stop':
        await handleStop(event);
        break;

      default:
        // Evento desconocido - ignorar silenciosamente
        break;
    }
  } catch {
    // Silencioso - nunca interrumpir Claude
  }

  // Siempre salir con éxito
  process.exit(0);
}

// Ejecutar
main();
