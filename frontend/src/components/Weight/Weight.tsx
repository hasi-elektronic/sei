import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { C } from '../../theme/colors'
import { calcDaysToGoal } from '../../utils/calculations'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Weight() {
  const { weightEntries, addWeight } = useAppStore()
  const { user } = useAuthStore()
  const [input, setInput] = useState('')
  const [added, setAdded] = useState(false)

  const targetW = user?.target_weight || 85

  const handleAdd = () => {
    const w = parseFloat(input)
    if (!w || w < 30 || w > 300) return
    addWeight(w)
    setInput('')
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const last7 = weightEntries.slice(-14)
  const chartData = last7.map(e => ({ date: e.date.slice(5), weight: e.weight }))

  const lastWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : user?.current_weight || 90
  const firstWeight = weightEntries.length > 1 ? weightEntries[0].weight : lastWeight
  const totalLost = +(firstWeight - lastWeight).toFixed(1)
  const daysToGoal = calcDaysToGoal(lastWeight, targetW)

  const CustomDot = (props: any) => {
    const { cx, cy } = props
    return <circle cx={cx} cy={cy} r={4} fill={C.success} stroke={C.bgSecondary} strokeWidth={2} />
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg px-3 py-2 text-sm" style={{ background: C.bgTertiary, color: C.textPrimary }}>
        <div className="font-mono font-bold">{payload[0].value} kg</div>
        <div style={{ color: C.textTertiary }}>{payload[0].payload.date}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-2xl p-4 border grid grid-cols-3 gap-2 text-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div>
          <div className="font-mono font-bold text-2xl">{lastWeight}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>Aktuell (kg)</div>
        </div>
        <div>
          <div className="font-mono font-bold text-2xl" style={{ color: totalLost > 0 ? C.success : C.textTertiary }}>
            {totalLost > 0 ? `-${totalLost}` : totalLost}
          </div>
          <div className="text-xs" style={{ color: C.textTertiary }}>Verloren (kg)</div>
        </div>
        <div>
          <div className="font-mono font-bold text-2xl" style={{ color: C.info }}>{daysToGoal}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>Tage bis Ziel</div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Verlauf</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: C.textTertiary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: C.textTertiary, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke={C.success}
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: C.success }}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Target line label */}
          <div className="flex justify-between mt-2 text-xs" style={{ color: C.textTertiary }}>
            <span>Ziel: {targetW} kg</span>
            <span>Noch {(lastWeight - targetW).toFixed(1)} kg</span>
          </div>
        </div>
      )}

      {/* Add weight */}
      <div className="rounded-2xl p-4 border space-y-3" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest" style={{ color: C.textTertiary }}>Gewicht eintragen</div>
        <div className="flex gap-3">
          <input
            type="number"
            step="0.1"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="94.5"
            className="flex-1 text-center text-2xl font-mono"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <span className="self-center text-lg" style={{ color: C.textTertiary }}>kg</span>
        </div>
        <button
          onClick={handleAdd}
          className="w-full py-3 rounded-xl font-semibold text-white"
          style={{ background: added ? C.success : C.info }}
        >
          {added ? '✓ Eingetragen!' : '+ Eintragen'}
        </button>
      </div>

      {/* History */}
      {weightEntries.length > 0 && (
        <div className="rounded-2xl p-4 border space-y-2" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Verlauf</div>
          {[...weightEntries].reverse().slice(0, 10).map((e, i) => {
            const prev = weightEntries[weightEntries.length - 1 - i - 1]
            const diff = prev ? +(e.weight - prev.weight).toFixed(1) : 0
            return (
              <div key={e.id} className="flex justify-between items-center py-2 border-b last:border-b-0" style={{ borderColor: C.borderLight }}>
                <span className="text-sm" style={{ color: C.textSecondary }}>{e.date}</span>
                <div className="flex items-center gap-3">
                  {diff !== 0 && (
                    <span className="text-xs" style={{ color: diff < 0 ? C.success : C.danger }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                  <span className="font-mono font-bold">{e.weight} kg</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
