import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useWeightEntries } from '../../hooks/useWeightEntries'
import { useTrainingSessions } from '../../hooks/useTrainingSessions'

const TYPE_ICONS: Record<string, string> = {
  sparring: '🥋',
  running: '🏃',
  cardio: '🚴',
  strength: '💪',
}

export function History() {
  const [tab, setTab] = useState<'weight' | 'training'>('weight')
  const { entries, deleteEntry } = useWeightEntries()
  const { sessions, deleteSession } = useTrainingSessions()

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-white text-xl font-bold mb-4">History</h2>

      <div className="flex gap-2 mb-4">
        {(['weight', 'training'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t
                ? 'bg-brand-purple text-white'
                : 'bg-surface-800 text-slate-400 hover:text-white'
            }`}
          >
            {t === 'weight' ? '⚖️ Weight' : '🥋 Training'}
          </button>
        ))}
      </div>

      {tab === 'weight' && (
        <div className="space-y-2">
          {entries.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No weight entries yet</p>
          )}
          {entries.map(e => (
            <div key={e.id} className="bg-surface-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <div>
                <p className="text-white font-semibold">{e.weight_kg} kg</p>
                <p className="text-slate-400 text-xs">{format(parseISO(e.date), 'EEE, MMM d yyyy')}</p>
                {e.notes && <p className="text-slate-500 text-xs mt-0.5">{e.notes}</p>}
              </div>
              <button
                onClick={() => deleteEntry(e.id)}
                className="ml-auto text-slate-600 hover:text-red-400 transition-colors text-lg"
                aria-label="Delete entry"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'training' && (
        <div className="space-y-2">
          {sessions.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No training sessions yet</p>
          )}
          {sessions.map(s => (
            <div key={s.id} className="bg-surface-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <div>
                <p className="text-white font-semibold capitalize">
                  {TYPE_ICONS[s.type]} {s.type} · {s.duration_minutes} min
                </p>
                <p className="text-slate-400 text-xs">{format(parseISO(s.date), 'EEE, MMM d yyyy')}</p>
                {s.notes && <p className="text-slate-500 text-xs mt-0.5">{s.notes}</p>}
              </div>
              <button
                onClick={() => deleteSession(s.id)}
                className="ml-auto text-slate-600 hover:text-red-400 transition-colors text-lg"
                aria-label="Delete session"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
