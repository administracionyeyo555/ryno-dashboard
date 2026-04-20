-- ============================================================================
-- MIGRACION: Agregar tabla project_metrics
-- ============================================================================
-- Esta migracion agrega la tabla project_metrics que almacena metricas de git
-- cacheadas para poder accederlas desde Vercel donde no hay acceso a los repos.
--
-- Ejecutar este script en Supabase SQL Editor para agregar la tabla.
-- ============================================================================

-- Crear la tabla project_metrics
CREATE TABLE IF NOT EXISTS project_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_slug TEXT UNIQUE NOT NULL,
    commits INTEGER,
    files INTEGER,
    lines TEXT,
    last_commit_message TEXT,
    last_commit_author TEXT,
    last_commit_date TIMESTAMPTZ,
    last_commit_time_ago TEXT,
    current_branch TEXT,
    uncommitted_files INTEGER,
    health_status TEXT CHECK (health_status IN ('green', 'yellow', 'red')) DEFAULT 'red',
    health_score INTEGER DEFAULT 0,
    last_activity_days_ago INTEGER,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentarios
COMMENT ON TABLE project_metrics IS 'Metricas de git cacheadas para acceso desde Vercel';
COMMENT ON COLUMN project_metrics.project_slug IS 'Slug del proyecto (key unica)';
COMMENT ON COLUMN project_metrics.commits IS 'Total de commits en el repositorio';
COMMENT ON COLUMN project_metrics.files IS 'Total de archivos rastreados por git';
COMMENT ON COLUMN project_metrics.lines IS 'Lineas de codigo (formato: 12.5k)';
COMMENT ON COLUMN project_metrics.last_commit_message IS 'Mensaje del ultimo commit';
COMMENT ON COLUMN project_metrics.last_commit_author IS 'Autor del ultimo commit';
COMMENT ON COLUMN project_metrics.last_commit_date IS 'Fecha del ultimo commit';
COMMENT ON COLUMN project_metrics.last_commit_time_ago IS 'Tiempo relativo del ultimo commit (ej: 2 days ago)';
COMMENT ON COLUMN project_metrics.current_branch IS 'Rama activa del repositorio';
COMMENT ON COLUMN project_metrics.uncommitted_files IS 'Archivos con cambios sin commitear';
COMMENT ON COLUMN project_metrics.health_status IS 'Estado de salud: green, yellow, red';
COMMENT ON COLUMN project_metrics.health_score IS 'Puntaje de salud (0-100)';
COMMENT ON COLUMN project_metrics.updated_at IS 'Ultima vez que se actualizaron las metricas';

-- Indices
CREATE INDEX IF NOT EXISTS idx_project_metrics_project_slug ON project_metrics(project_slug);
CREATE INDEX IF NOT EXISTS idx_project_metrics_updated_at ON project_metrics(updated_at DESC);

-- Trigger para updated_at (reutiliza la funcion existente)
DROP TRIGGER IF EXISTS update_project_metrics_updated_at ON project_metrics;
CREATE TRIGGER update_project_metrics_updated_at
    BEFORE UPDATE ON project_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;

-- Politica permisiva
DROP POLICY IF EXISTS "Allow all access to project_metrics" ON project_metrics;
CREATE POLICY "Allow all access to project_metrics" ON project_metrics
    FOR ALL USING (true) WITH CHECK (true);

-- Agregar proyecto flowmando si no existe
INSERT INTO projects (name, slug, color, active)
VALUES ('Flowmando', 'flowmando', '#3B82F6', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO project_status (project_slug, tasks_completed, tasks_pending, health)
VALUES ('flowmando', 0, 0, 'green')
ON CONFLICT (project_slug) DO NOTHING;

-- ============================================================================
-- VERIFICACION
-- ============================================================================
-- Ejecutar para verificar que la tabla se creo correctamente:
-- SELECT * FROM project_metrics;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_metrics';
