'use client'

import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useDashboardStore } from '@/stores/dashboard-store'
import type { Project } from '@/types/database'

// Tipo de la BD real
interface DBProject {
  id: string
  name: string
  slug: string
  color: string
  repo_path: string | null
  active: boolean
  created_at: string
}

// Tipo de project_status de la BD
interface DBProjectStatus {
  project_slug: string
  last_activity: string | null
  tasks_completed: number
  tasks_pending: number
  health: 'green' | 'yellow' | 'red'
}

export function useProjects() {
  const { projects, setProjects, selectedProjectId, setSelectedProject } =
    useDashboardStore()

  const fetchProjects = useCallback(async () => {
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true })

      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
        return
      }

      // Fetch project status
      const { data: statusData } = await supabase
        .from('project_status')
        .select('*')

      // Fetch session counts per project
      const { data: sessionsData } = await supabase
        .from('agent_sessions')
        .select('project_slug')

      // Fetch event counts per project (via sessions)
      const { data: eventsData } = await supabase
        .from('agent_events')
        .select('session_id')

      // Fetch task counts per project
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('project_slug')

      // Create status map
      const statusMap = new Map<string, DBProjectStatus>()
      statusData?.forEach((s) => statusMap.set(s.project_slug, s))

      // Count sessions per project
      const sessionCounts = new Map<string, number>()
      sessionsData?.forEach((s) => {
        const count = sessionCounts.get(s.project_slug) || 0
        sessionCounts.set(s.project_slug, count + 1)
      })

      // Count tasks per project
      const taskCounts = new Map<string, number>()
      tasksData?.forEach((t) => {
        const count = taskCounts.get(t.project_slug) || 0
        taskCounts.set(t.project_slug, count + 1)
      })

      // Transform to frontend Project type
      const transformedProjects: Project[] = (projectsData as DBProject[]).map((p) => {
        const status = statusMap.get(p.slug)
        const healthScore = status?.health === 'green' ? 100 : status?.health === 'yellow' ? 50 : 0

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: null,
          color: p.color,
          status: p.active ? 'active' : 'paused',
          health_score: healthScore,
          total_sessions: sessionCounts.get(p.slug) || 0,
          total_events: eventsData?.length || 0,
          total_tasks: taskCounts.get(p.slug) || 0,
          created_at: p.created_at,
          updated_at: p.created_at,
        }
      })

      setProjects(transformedProjects)
    } catch (err) {
      console.error('Error in fetchProjects:', err)
    }
  }, [setProjects])

  useEffect(() => {
    fetchProjects()

    // Subscribe to project changes
    const channel = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          fetchProjects()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchProjects])

  return {
    projects,
    selectedProjectId,
    setSelectedProject,
    refetch: fetchProjects,
  }
}
