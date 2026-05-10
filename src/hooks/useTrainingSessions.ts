import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TrainingSession, SessionType } from '../types'

export function useTrainingSessions() {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) setSessions(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const addSession = async (session: {
    date: string
    type: SessionType
    duration_minutes: number
    notes?: string
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('training_sessions')
      .insert({ ...session, user_id: user.id })

    if (!error) await fetchSessions()
    return { error }
  }

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('training_sessions').delete().eq('id', id)
    if (!error) await fetchSessions()
    return { error }
  }

  return { sessions, loading, addSession, deleteSession, refetch: fetchSessions }
}
