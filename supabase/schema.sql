-- ============================================================================
-- FLOWMANDO PLATFORM - SCHEMA SQL PARA SUPABASE
-- ============================================================================
-- Este archivo contiene el schema completo de la base de datos para el
-- sistema de monitoreo de agentes de Flowmando.
--
-- Incluye:
--   - Tablas principales (projects, agent_sessions, agent_events, etc.)
--   - Indices para optimizar consultas frecuentes
--   - Triggers para actualizar timestamps automaticamente
--   - Row Level Security (RLS) con politicas permisivas
--   - Configuracion de Realtime para tablas criticas
--   - Datos iniciales (seed data) para los 4 proyectos
-- ============================================================================

-- ============================================================================
-- LIMPIEZA INICIAL (por si existen objetos previos)
-- ============================================================================

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS update_project_status_updated_at ON project_status;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;

-- Eliminar funcion de trigger si existe
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Eliminar tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS agent_events CASCADE;
DROP TABLE IF EXISTS agent_sessions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_status CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================================================
-- TABLA: projects
-- ============================================================================
-- Tabla principal que almacena la informacion de cada proyecto monitoreado.
-- Cada proyecto tiene un slug unico que se usa como referencia en otras tablas.

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL,
    repo_path TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE projects IS 'Proyectos monitoreados por Flowmando';
COMMENT ON COLUMN projects.slug IS 'Identificador unico del proyecto (URL-friendly)';
COMMENT ON COLUMN projects.color IS 'Color hex para mostrar en el dashboard';
COMMENT ON COLUMN projects.repo_path IS 'Ruta local al repositorio del proyecto';

-- ============================================================================
-- TABLA: agent_sessions
-- ============================================================================
-- Registra cada sesion de trabajo de un agente en un proyecto.
-- Una sesion representa un periodo continuo de actividad del agente.

CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_slug TEXT REFERENCES projects(slug) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'stopped', 'error')) DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT now(),
    stopped_at TIMESTAMPTZ,
    summary TEXT,
    files_touched TEXT[] DEFAULT '{}'
);

COMMENT ON TABLE agent_sessions IS 'Sesiones de trabajo de agentes por proyecto';
COMMENT ON COLUMN agent_sessions.agent_name IS 'Nombre del agente (ej: claude-code, cursor)';
COMMENT ON COLUMN agent_sessions.status IS 'Estado actual: active, stopped, o error';
COMMENT ON COLUMN agent_sessions.files_touched IS 'Array de archivos modificados durante la sesion';

-- ============================================================================
-- TABLA: agent_events
-- ============================================================================
-- Log detallado de eventos que ocurren durante una sesion de agente.
-- Permite rastrear cada accion especifica del agente.

CREATE TABLE agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    tool_name TEXT,
    file_path TEXT,
    detail JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE agent_events IS 'Eventos individuales durante sesiones de agentes';
COMMENT ON COLUMN agent_events.event_type IS 'Tipo de evento (ej: file_edit, tool_call, error)';
COMMENT ON COLUMN agent_events.tool_name IS 'Herramienta utilizada (si aplica)';
COMMENT ON COLUMN agent_events.detail IS 'Informacion adicional en formato JSON';

-- ============================================================================
-- TABLA: project_status
-- ============================================================================
-- Estado actual de cada proyecto. Se actualiza en tiempo real.
-- Proporciona una vista rapida del estado de salud de cada proyecto.

CREATE TABLE project_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_slug TEXT UNIQUE REFERENCES projects(slug) ON DELETE CASCADE,
    last_activity TIMESTAMPTZ DEFAULT now(),
    tasks_completed INTEGER DEFAULT 0,
    tasks_pending INTEGER DEFAULT 0,
    health TEXT CHECK (health IN ('green', 'yellow', 'red')) DEFAULT 'green',
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE project_status IS 'Estado actual y metricas de cada proyecto';
COMMENT ON COLUMN project_status.health IS 'Indicador de salud: green (ok), yellow (warning), red (critico)';
COMMENT ON COLUMN project_status.tasks_completed IS 'Numero total de tareas completadas';
COMMENT ON COLUMN project_status.tasks_pending IS 'Numero de tareas pendientes';

-- ============================================================================
-- TABLA: tasks
-- ============================================================================
-- Tareas asignadas a cada proyecto. Pueden ser creadas por humanos o agentes.

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_slug TEXT REFERENCES projects(slug) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'done')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    assigned_to TEXT,
    created_by TEXT NOT NULL DEFAULT 'human',
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE tasks IS 'Tareas y pendientes por proyecto';
COMMENT ON COLUMN tasks.created_by IS 'Quien creo la tarea: human o nombre del agente';
COMMENT ON COLUMN tasks.assigned_to IS 'Agente o persona asignada a la tarea';

-- ============================================================================
-- INDICES PARA OPTIMIZAR CONSULTAS FRECUENTES
-- ============================================================================

-- Indices para projects
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_active ON projects(active);

-- Indices para agent_sessions
CREATE INDEX idx_agent_sessions_project_slug ON agent_sessions(project_slug);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX idx_agent_sessions_started_at ON agent_sessions(started_at DESC);
CREATE INDEX idx_agent_sessions_agent_name ON agent_sessions(agent_name);

-- Indices para agent_events
CREATE INDEX idx_agent_events_session_id ON agent_events(session_id);
CREATE INDEX idx_agent_events_event_type ON agent_events(event_type);
CREATE INDEX idx_agent_events_timestamp ON agent_events(timestamp DESC);
CREATE INDEX idx_agent_events_tool_name ON agent_events(tool_name);

-- Indices para project_status
CREATE INDEX idx_project_status_project_slug ON project_status(project_slug);
CREATE INDEX idx_project_status_health ON project_status(health);
CREATE INDEX idx_project_status_last_activity ON project_status(last_activity DESC);

-- Indices para tasks
CREATE INDEX idx_tasks_project_slug ON tasks(project_slug);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- ============================================================================
-- FUNCION Y TRIGGER PARA ACTUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Actualiza automaticamente el campo updated_at en cada UPDATE';

-- Trigger para project_status
CREATE TRIGGER update_project_status_updated_at
    BEFORE UPDATE ON project_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Habilitamos RLS con politicas permisivas para todas las tablas.
-- En produccion, estas politicas deben ser mas restrictivas.

-- Habilitar RLS en todas las tablas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Politicas permisivas para projects
CREATE POLICY "Allow all access to projects" ON projects
    FOR ALL USING (true) WITH CHECK (true);

-- Politicas permisivas para agent_sessions
CREATE POLICY "Allow all access to agent_sessions" ON agent_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Politicas permisivas para agent_events
CREATE POLICY "Allow all access to agent_events" ON agent_events
    FOR ALL USING (true) WITH CHECK (true);

-- Politicas permisivas para project_status
CREATE POLICY "Allow all access to project_status" ON project_status
    FOR ALL USING (true) WITH CHECK (true);

-- Politicas permisivas para tasks
CREATE POLICY "Allow all access to tasks" ON tasks
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- CONFIGURACION DE REALTIME
-- ============================================================================
-- Habilitamos Supabase Realtime para las tablas que requieren
-- actualizaciones en tiempo real en el dashboard.

-- Nota: En Supabase, esto se configura via la API o el dashboard,
-- pero incluimos los comandos SQL para referencia.

-- Para habilitar realtime, ejecutar en Supabase:
-- ALTER PUBLICATION supabase_realtime ADD TABLE agent_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE agent_events;

-- Si la publicacion no existe, crearla primero:
-- CREATE PUBLICATION supabase_realtime;

-- Intentamos agregar las tablas a la publicacion de realtime
DO $$
BEGIN
    -- Verificar si la publicacion existe
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Agregar tablas a realtime (ignorar errores si ya existen)
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE agent_sessions;
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ya existe, ignorar
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE agent_events;
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ya existe, ignorar
        END;
    END IF;
END $$;

-- ============================================================================
-- SEED DATA - DATOS INICIALES
-- ============================================================================

-- Insertar los 4 proyectos principales
INSERT INTO projects (name, slug, color, active) VALUES
    ('ASOTOY', 'asotoy', '#CC0000', true),
    ('Caracas Golf Market', 'caracas-golf-market', '#2D5016', true),
    ('DABI', 'dabi', '#7C3AED', true),
    ('Flowmando Platform', 'flowmando-platform', '#FF6B35', true);

-- Insertar estado inicial para cada proyecto
INSERT INTO project_status (project_slug, tasks_completed, tasks_pending, health) VALUES
    ('asotoy', 0, 0, 'green'),
    ('caracas-golf-market', 0, 0, 'green'),
    ('dabi', 0, 0, 'green'),
    ('flowmando-platform', 0, 0, 'green');

-- ============================================================================
-- VERIFICACION FINAL
-- ============================================================================
-- Consulta para verificar que todo se creo correctamente

-- SELECT
--     table_name,
--     (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
-- FROM information_schema.tables t
-- WHERE table_schema = 'public'
-- AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
