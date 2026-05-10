import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useTrainingSessions } from '../../hooks/useTrainingSessions'
import type { SessionType } from '../../types'

const SESSION_TYPES: { type: SessionType; icon: string; label: string }[] = [
  { type: 'sparring', icon: '🥋', label: 'Sparring' },
  { type: 'running', icon: '🏃', label: 'Running' },
  { type: 'cardio', icon: '🚴', label: 'Cardio' },
  { type: 'strength', icon: '💪', label: 'Strength' },
]

export function LogTraining() {
  const navigate = useNavigate()
  const { addSession } = useTrainingSessions()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sessionType, setSessionType] = useState<SessionType | null>(null)
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionType || !duration) return

    setSaving(true)
    setError('')
    const { error } = await addSession({
      date,
      type: sessionType,
      duration_minutes: parseInt(duration),
      notes: notes || undefined,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-white text-xl font-bold mb-6">Log Training</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Session Type</label>
          <div className="grid grid-cols-2 gap-2">
            {SESSION_TYPES.map(({ type, icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSessionType(type)}
                className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                  sessionType === type
                    ? 'bg-brand-amber text-surface-900 border-2 border-brand-amber'
                    : 'bg-surface-800 text-slate-400 border-2 border-surface-700 hover:border-slate-500'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="1"
            max="480"
            placeholder="60"
            required
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-4 text-white text-2xl font-bold text-center focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
            Notes <span className="text-slate-600 normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Hard session, good cardio"
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-purple"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || !sessionType}
          className="w-full bg-brand-amber text-surface-900 rounded-xl py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Session'}
        </button>
      </form>
    </div>
  )
}
