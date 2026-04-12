-- ============================================================================
-- Project Metrics Table - RYNO Studio
-- ============================================================================
-- Creates the project_metrics table for storing git repository metrics.
--
-- Run this SQL in your Supabase SQL Editor:
--   https://supabase.com/dashboard/project/xzkasvcqvddmgybzajeu/sql/new
-- ============================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS project_metrics (
  -- Primary key
  project_slug TEXT PRIMARY KEY,

  -- Git statistics
  commits INTEGER DEFAULT 0,
  files INTEGER DEFAULT 0,
  lines INTEGER DEFAULT 0,

  -- Last commit information
  last_commit_message TEXT,
  last_commit_author TEXT,
  last_commit_date TIMESTAMPTZ,

  -- Repository state
  branch TEXT DEFAULT 'main',
  uncommitted_files INTEGER DEFAULT 0,

  -- Calculated metrics
  health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),

  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_metrics_updated_at
  ON project_metrics(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_metrics_health_score
  ON project_metrics(health_score DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone with the anon key to read
CREATE POLICY "Allow public read access"
  ON project_metrics
  FOR SELECT
  USING (true);

-- Policy: Allow anyone with the anon key to insert/update
-- (For production, you may want to restrict this to service_role only)
CREATE POLICY "Allow public write access"
  ON project_metrics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Useful Views (optional)
-- ============================================================================

-- View: Projects with health issues
CREATE OR REPLACE VIEW project_health_alerts AS
SELECT
  project_slug,
  health_score,
  uncommitted_files,
  branch,
  last_commit_date,
  CASE
    WHEN health_score < 50 THEN 'critical'
    WHEN health_score < 70 THEN 'warning'
    ELSE 'healthy'
  END as status,
  EXTRACT(DAY FROM NOW() - last_commit_date) as days_since_commit
FROM project_metrics
WHERE health_score < 100
ORDER BY health_score ASC;

-- View: Project summary
CREATE OR REPLACE VIEW project_summary AS
SELECT
  COUNT(*) as total_projects,
  SUM(commits) as total_commits,
  SUM(files) as total_files,
  SUM(lines) as total_lines,
  AVG(health_score)::INTEGER as avg_health_score,
  SUM(uncommitted_files) as total_uncommitted
FROM project_metrics;

-- ============================================================================
-- Function: Update timestamp automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_project_metrics_updated_at ON project_metrics;
CREATE TRIGGER update_project_metrics_updated_at
  BEFORE UPDATE ON project_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Sample Data (optional - for testing)
-- ============================================================================
-- Uncomment to insert sample data:
--
-- INSERT INTO project_metrics (project_slug, commits, files, lines, branch, health_score)
-- VALUES
--   ('caracas-golf-market', 150, 200, 15000, 'main', 95),
--   ('dabi', 300, 350, 45000, 'main', 88),
--   ('flowmando-platform', 500, 400, 60000, 'develop', 75),
--   ('flowmando', 100, 150, 10000, 'main', 100)
-- ON CONFLICT (project_slug) DO UPDATE SET
--   commits = EXCLUDED.commits,
--   files = EXCLUDED.files,
--   lines = EXCLUDED.lines,
--   branch = EXCLUDED.branch,
--   health_score = EXCLUDED.health_score;
