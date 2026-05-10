import { useState, useEffect } from 'react'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useAuth } from '../../hooks/useAuth'

async function subscribeToPush(): Promise<PushSubscriptionJSON | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing.toJSON()

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string
  if (!vapidKey) return null

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKey,
  })
  return sub.toJSON()
}

export function Settings() {
  const { settings, updateSettings } = useUserSettings()
  const { signOut } = useAuth()
  const [targetWeight, setTargetWeight] = useState('')
  const [startWeight, setStartWeight] = useState('')
  const [reminderTime, setReminderTime] = useState('21:00')
  const [saving, setSaving] = useState(false)
  const [notifError, setNotifError] = useState('')

  useEffect(() => {
    if (settings) {
      setTargetWeight(String(settings.target_weight_kg))
      setStartWeight(settings.start_weight_kg ? String(settings.start_weight_kg) : '')
      setReminderTime(settings.reminder_time)
    }
  }, [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await updateSettings({
      target_weight_kg: parseFloat(targetWeight),
      start_weight_kg: startWeight ? parseFloat(startWeight) : null,
      reminder_time: reminderTime,
    })
    setSaving(false)
  }

  const handleNotificationsToggle = async () => {
    if (!settings) return
    setNotifError('')

    if (settings.notifications_enabled) {
      await updateSettings({ notifications_enabled: false })
      return
    }

    const sub = await subscribeToPush()
    if (!sub) {
      setNotifError(
        Notification.permission === 'denied'
          ? 'Notifications blocked. Enable them in browser settings.'
          : 'Push notifications not supported in this browser.'
      )
      return
    }
    await updateSettings({ notifications_enabled: true, push_subscription: sub })
  }

  if (!settings) return null

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-white text-xl font-bold mb-6">Settings</h2>

      <form onSubmit={handleSave} className="space-y-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Target Weight (kg)</label>
          <input
            type="number"
            value={targetWeight}
            onChange={e => setTargetWeight(e.target.value)}
            step="0.1" min="30" max="200"
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Starting Weight (kg)</label>
          <input
            type="number"
            value={startWeight}
            onChange={e => setStartWeight(e.target.value)}
            step="0.1" min="30" max="200"
            placeholder="Used for progress bar"
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Reminder Time</label>
          <input
            type="time"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-purple text-white rounded-xl py-3 font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      <div className="bg-surface-800 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white font-semibold text-sm">Weight Reminders</p>
            <p className="text-slate-400 text-xs mt-0.5">Notify me if I haven't logged by {reminderTime}</p>
          </div>
          <button
            onClick={handleNotificationsToggle}
            type="button"
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.notifications_enabled ? 'bg-brand-green' : 'bg-surface-700'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.notifications_enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        {notifError && <p className="text-red-400 text-xs mt-2">{notifError}</p>}
      </div>

      <button
        onClick={signOut}
        type="button"
        className="w-full bg-surface-800 text-slate-400 rounded-xl py-3 font-semibold hover:text-white transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
