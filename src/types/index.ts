export type SessionType = 'sparring' | 'running' | 'cardio' | 'strength'

export interface WeightEntry {
  id: string
  user_id: string
  date: string        // ISO date string "YYYY-MM-DD"
  weight_kg: number
  notes: string | null
  created_at: string
}

export interface TrainingSession {
  id: string
  user_id: string
  date: string
  type: SessionType
  duration_minutes: number
  notes: string | null
  created_at: string
}

export interface UserSettings {
  user_id: string
  target_weight_kg: number
  start_weight_kg: number | null
  reminder_time: string   // "HH:MM"
  notifications_enabled: boolean
  push_subscription: PushSubscriptionJSON | null
}
