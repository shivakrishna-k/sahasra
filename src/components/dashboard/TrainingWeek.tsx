import { startOfWeek, isBefore, addDays, format } from 'date-fns'
import type { TrainingSession } from '../../types'

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const TYPE_COLORS: Record<string, string> = {
  sparring: '#f59e0b',
  running: '#6366f1',
  cardio: '#ec4899',
  strength: '#22c55e',
}

const TYPE_ICONS: Record<string, string> = {
  sparring: '🥋',
  running: '🏃',
  cardio: '🚴',
  strength: '💪',
}

interface Props { sessions: TrainingSession[] }

export function TrainingWeek({ sessions }: Props) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)

  const thisWeek = sessions
    .filter(s => {
      const d = parseLocalDate(s.date)
      return !isBefore(d, weekStart) && isBefore(d, weekEnd)
    })
    .slice(0, 5)

  return (
    <div className="bg-surface-800 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-slate-400 text-xs uppercase tracking-widest">This Week's Training</p>
        <span className="text-brand-purple text-xs">{thisWeek.length} session{thisWeek.length !== 1 ? 's' : ''}</span>
      </div>

      {thisWeek.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-3">No sessions yet this week</p>
      ) : (
        <div className="space-y-3">
          {thisWeek.map(s => (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: TYPE_COLORS[s.type] }}
              />
              <span className="text-white text-sm">
                {TYPE_ICONS[s.type]} {s.type.charAt(0).toUpperCase() + s.type.slice(1)}
              </span>
              <span className="ml-auto text-slate-500 text-xs">
                {s.duration_minutes} min · {format(parseLocalDate(s.date), 'EEE')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
