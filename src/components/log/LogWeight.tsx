import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useWeightEntries } from '../../hooks/useWeightEntries'

export function LogWeight() {
  const navigate = useNavigate()
  const { upsertEntry } = useWeightEntries()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight) return

    setSaving(true)
    setError('')
    const { error } = await upsertEntry({
      date,
      weight_kg: parseFloat(weight),
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
      <h2 className="text-white text-xl font-bold mb-6">Log Weight</h2>
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
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            step="0.1"
            min="30"
            max="200"
            placeholder="58.4"
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
            placeholder="Morning, before food"
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-purple"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-purple text-white rounded-xl py-3 font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </form>
    </div>
  )
}
