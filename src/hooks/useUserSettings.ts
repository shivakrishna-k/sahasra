import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { UserSettings } from '../types'

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id'> = {
  target_weight_kg: 54.0,
  start_weight_kg: null,
  reminder_time: '21:00',
  notifications_enabled: false,
  push_subscription: null,
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setSettings(data)
    } else {
      const { data: created, error: createError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
        .select()
        .single()
      if (createError) console.error('Failed to create user settings:', createError)
      if (created) setSettings(created)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const updateSettings = async (updates: Partial<Omit<UserSettings, 'user_id'>>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)

    if (!error) await fetchSettings()
    return { error }
  }

  return { settings, loading, updateSettings, refetch: fetchSettings }
}
