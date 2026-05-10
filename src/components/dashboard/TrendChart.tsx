import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { linearRegression, projectDate } from '../../lib/regression'
import type { WeightEntry, UserSettings } from '../../types'

interface Props {
  entries: WeightEntry[]
  settings: UserSettings
}

export function TrendChart({ entries, settings }: Props) {
  if (entries.length < 2) return null

  const target = settings.target_weight_kg

  const sorted = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)

  const baseDate = parseISO(sorted[0].date)

  const actualPoints = sorted.map(e => ({
    x: Math.round((parseISO(e.date).getTime() - baseDate.getTime()) / 86400000),
    y: e.weight_kg,
    label: format(parseISO(e.date), 'MMM d'),
  }))

  const regression = linearRegression(actualPoints)
  const lastPoint = actualPoints.at(-1)!
  const projectedDate = regression
    ? projectDate(regression, target, parseISO(sorted.at(-1)!.date), lastPoint.x)
    : null

  const chartData = actualPoints.map(p => ({
    name: p.label,
    actual: p.y,
    projected: undefined as number | undefined,
  }))

  if (projectedDate && regression) {
    chartData.push({
      name: format(projectedDate, 'MMM d'),
      actual: undefined as unknown as number,
      projected: target,
    })
  }

  const allWeights = actualPoints.map(p => p.y)
  const yMin = Math.floor(Math.min(...allWeights, target) - 1)
  const yMax = Math.ceil(Math.max(...allWeights) + 1)

  return (
    <div className="bg-surface-800 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-slate-400 text-xs uppercase tracking-widest">Weight Trend</p>
        {projectedDate && (
          <span className="text-xs bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-lg">
            On track for {format(projectedDate, 'MMM d')}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
          <YAxis domain={[yMin, yMax]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8', fontSize: 12 }}
            itemStyle={{ color: '#f1f5f9', fontSize: 13 }}
          />
          <ReferenceLine y={target} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1' }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
