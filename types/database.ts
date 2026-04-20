export type ProjectStatus = 'active' | 'paused' | 'completed' | 'error'

export type TaskStatus = 'pending' | 'in_progress' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  status: ProjectStatus
  health_score: number
  total_sessions: number
  total_events: number
  total_tasks: number
  created_at: string
  updated_at: string
}

export interface AgentSession {
  id: string
  project_id: string
  agent_name: string
  status: 'running' | 'idle' | 'completed' | 'error' | 'active' | 'stopped'
  current_tool: string | null
  current_file: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number
  events_count: number
  project?: Project
}

export interface AgentEvent {
  id: string
  session_id: string
  event_type: 'tool_use' | 'file_edit' | 'file_read' | 'error' | 'completion' | 'message'
  tool_name: string | null
  file_path: string | null
  detail: Record<string, unknown> | null
  timestamp: string
  // Computed/virtual fields for convenience
  message?: string | null
  session?: AgentSession
  project?: Project
}

// Task type matching Supabase table structure
export interface Task {
  id: string
  project_slug: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  created_by: string
  created_at: string
  completed_at: string | null
  // Relations
  project?: ProjectDB
}

// Project type matching Supabase table structure
export interface ProjectDB {
  id: string
  name: string
  slug: string
  color: string
  repo_path: string
  active: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      agent_sessions: {
        Row: AgentSession
        Insert: Omit<AgentSession, 'id' | 'started_at'>
        Update: Partial<Omit<AgentSession, 'id' | 'started_at'>>
      }
      agent_events: {
        Row: AgentEvent
        Insert: Omit<AgentEvent, 'id' | 'created_at'>
        Update: Partial<Omit<AgentEvent, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'completed_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
      }
    }
  }
}
