import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { WeightEntry } from '../types'

export function useWeightEntries() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const upsertEntry = async (entry: { date: string; weight_kg: number; notes?: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('weight_entries')
      .upsert({ ...entry, user_id: user.id }, { onConflict: 'user_id,date' })

    if (!error) await fetchEntries()
    return { error }
  }

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('weight_entries').delete().eq('id', id)
    if (!error) await fetchEntries()
    return { error }
  }

  return { entries, loading, upsertEntry, deleteEntry, refetch: fetchEntries }
}
