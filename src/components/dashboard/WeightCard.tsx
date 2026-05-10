import type { WeightEntry, UserSettings } from '../../types'

interface Props {
  entries: WeightEntry[]
  settings: UserSettings
}

export function WeightCard({ entries, settings }: Props) {
  const latest = entries[0]
  const previous = entries[1]
  const delta = latest && previous
    ? latest.weight_kg - previous.weight_kg
    : null

  const start = settings.start_weight_kg ?? (entries[entries.length - 1]?.weight_kg ?? 0)
  const target = settings.target_weight_kg
  const current = latest?.weight_kg ?? start
  const progress = start === target ? 100 : Math.min(100, Math.max(0,
    ((start - current) / (start - target)) * 100
  ))
  const remaining = latest ? Math.max(0, latest.weight_kg - target) : null

  if (!latest) {
    return (
      <div className="bg-surface-800 rounded-2xl p-4">
        <p className="text-slate-400 text-sm text-center py-4">
          No weight logged yet —{' '}
          <a href="/log-weight" className="text-brand-purple underline">log your first entry</a>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-800 rounded-2xl p-4">
      <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Current Weight</p>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-white text-5xl font-extrabold">{latest.weight_kg}</span>
        <span className="text-slate-400 text-lg">kg</span>
        {delta !== null && (
          <span className={`ml-auto text-sm px-3 py-1 rounded-lg font-medium ${
            delta <= 0
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {delta <= 0 ? '↓' : '↑'} {Math.abs(delta).toFixed(1)} kg
          </span>
        )}
      </div>

      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Start: {start} kg</span>
        <span>Target: {target} kg</span>
      </div>
      <div className="h-2 bg-surface-900 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-green transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {remaining !== null && (
        <p className="text-slate-400 text-xs text-center mt-2">
          {remaining === 0 ? 'Target reached!' : `${remaining.toFixed(1)} kg to go`}
        </p>
      )}
    </div>
  )
}
