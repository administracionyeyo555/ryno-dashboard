import { create } from 'zustand'
import type { Project, AgentSession, AgentEvent, Task } from '@/types/database'

interface DashboardState {
  // Projects
  projects: Project[]
  selectedProjectId: string | null
  setProjects: (projects: Project[]) => void
  setSelectedProject: (id: string | null) => void

  // Agent Sessions
  activeSessions: AgentSession[]
  setActiveSessions: (sessions: AgentSession[]) => void
  addSession: (session: AgentSession) => void
  updateSession: (id: string, updates: Partial<AgentSession>) => void
  removeSession: (id: string) => void

  // Events
  events: AgentEvent[]
  setEvents: (events: AgentEvent[]) => void
  addEvent: (event: AgentEvent) => void

  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void

  // UI State
  isSidebarCollapsed: boolean
  toggleSidebar: () => void

  // Filters
  eventFilter: string | null
  setEventFilter: (filter: string | null) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Projects
  projects: [],
  selectedProjectId: null,
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),

  // Agent Sessions
  activeSessions: [],
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),
  addSession: (session) =>
    set((state) => ({
      activeSessions: [...state.activeSessions, session],
    })),
  updateSession: (id, updates) =>
    set((state) => ({
      activeSessions: state.activeSessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  removeSession: (id) =>
    set((state) => ({
      activeSessions: state.activeSessions.filter((s) => s.id !== id),
    })),

  // Events
  events: [],
  setEvents: (events) => set({ events }),
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100), // Keep last 100 events
    })),

  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  // UI State
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  // Filters
  eventFilter: null,
  setEventFilter: (filter) => set({ eventFilter: filter }),
}))
