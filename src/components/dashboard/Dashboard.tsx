import { format } from 'date-fns'
import { useWeightEntries } from '../../hooks/useWeightEntries'
import { useTrainingSessions } from '../../hooks/useTrainingSessions'
import { useUserSettings } from '../../hooks/useUserSettings'
import { WeightCard } from './WeightCard'
import { TrendChart } from './TrendChart'
import { TrainingWeek } from './TrainingWeek'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const { entries, loading: loadingW } = useWeightEntries()
  const { sessions, loading: loadingT } = useTrainingSessions()
  const { settings, loading: loadingS } = useUserSettings()

  const loading = loadingW || loadingT || loadingS

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto p-4 space-y-3">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-widest">{format(new Date(), 'EEEE, MMM d')}</p>
          <h1 className="text-white text-xl font-bold">{getGreeting()}, Sahasra</h1>
        </div>
        <div className="w-10 h-10 bg-brand-purple rounded-full flex items-center justify-center text-white font-bold text-lg">
          S
        </div>
      </div>

      {settings && <WeightCard entries={entries} settings={settings} />}
      {settings && <TrendChart entries={entries} settings={settings} />}
      <TrainingWeek sessions={sessions} />
    </div>
  )
}
