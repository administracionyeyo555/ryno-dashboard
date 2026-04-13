'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface WikiContent {
  stack: string
  architecture: string
  decisions: string[]
  known_issues: string[]
  pending_work: string[]
  important_files: string[]
}

export interface ProjectWiki {
  id: string
  project_slug: string
  content: WikiContent
  last_updated_by: string | null
  updated_at: string
}

export const defaultWikiContent: WikiContent = {
  stack: '',
  architecture: '',
  decisions: [],
  known_issues: [],
  pending_work: [],
  important_files: [],
}

export function useAllWikis() {
  const [wikis, setWikis] = useState<ProjectWiki[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWikis = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('project_wiki')
        .select('*')
        .order('project_slug', { ascending: true })
      if (fetchError) throw fetchError
      setWikis(data || [])
    } catch (err) {
      console.error('Error fetching wikis:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWikis()
    const channel = supabase
      .channel('wiki_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_wiki' }, () => fetchWikis())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchWikis])

  return { wikis, isLoading, error, refetch: fetchWikis }
}

export function useProjectWiki(projectSlug: string | null) {
  const [wiki, setWiki] = useState<ProjectWiki | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWiki = useCallback(async () => {
    if (!projectSlug) { setWiki(null); setIsLoading(false); return }
    try {
      setIsLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('project_wiki')
        .select('*')
        .eq('project_slug', projectSlug)
        .single()
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('project_wiki')
            .insert({ project_slug: projectSlug, content: defaultWikiContent, last_updated_by: 'system' })
            .select()
            .single()
          if (insertError) throw insertError
          setWiki(newData)
        } else throw fetchError
      } else setWiki(data)
    } catch (err) {
      console.error('Error fetching wiki:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally { setIsLoading(false) }
  }, [projectSlug])

  useEffect(() => { fetchWiki() }, [fetchWiki])

  const saveWiki = useCallback(async (content: WikiContent, updatedBy: string = 'unknown') => {
    if (!projectSlug) return false
    try {
      setIsSaving(true)
      setError(null)
      const { data, error: updateError } = await supabase
        .from('project_wiki')
        .upsert({ project_slug: projectSlug, content, last_updated_by: updatedBy }, { onConflict: 'project_slug' })
        .select()
        .single()
      if (updateError) throw updateError
      setWiki(data)
      return true
    } catch (err) {
      console.error('Error saving wiki:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar')
      return false
    } finally { setIsSaving(false) }
  }, [projectSlug])

  const updateField = useCallback(async <K extends keyof WikiContent>(field: K, value: WikiContent[K], updatedBy: string = 'unknown') => {
    if (!wiki) return false
    return saveWiki({ ...wiki.content, [field]: value }, updatedBy)
  }, [wiki, saveWiki])

  const addToArrayField = useCallback(async (field: 'decisions' | 'known_issues' | 'pending_work' | 'important_files', item: string, updatedBy: string = 'unknown') => {
    if (!wiki) return false
    return updateField(field, [...(wiki.content[field] || []), item], updatedBy)
  }, [wiki, updateField])

  const removeFromArrayField = useCallback(async (field: 'decisions' | 'known_issues' | 'pending_work' | 'important_files', index: number, updatedBy: string = 'unknown') => {
    if (!wiki) return false
    return updateField(field, (wiki.content[field] || []).filter((_, i) => i !== index), updatedBy)
  }, [wiki, updateField])

  const updateArrayItem = useCallback(async (field: 'decisions' | 'known_issues' | 'pending_work' | 'important_files', index: number, newValue: string, updatedBy: string = 'unknown') => {
    if (!wiki) return false
    return updateField(field, (wiki.content[field] || []).map((item, i) => i === index ? newValue : item), updatedBy)
  }, [wiki, updateField])

  return { wiki, isLoading, isSaving, error, refetch: fetchWiki, saveWiki, updateField, addToArrayField, removeFromArrayField, updateArrayItem }
}
