import { useState, useEffect } from 'react'
import { useStepsStore, stepsToKcal, stepsToKm } from '../../store/stepsStore'
import { usePedometer } from '../../hooks/usePedometer'
import { C } from '../../theme/colors'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const QUICK = [1000, 2000, 5000, 8000, 10000, 12000]

export default function Steps() {
  const { todaySteps, stepGoal, stepDays, setSteps, addSteps, setGoal, saveTodaySteps } = useStepsStore()
  const { supported, isTracking, start, stop } = usePedometer()
  const [manualInput, setManualInput] = useState('')
  const [editGoal, setEditGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(String(stepGoal))
  const [trackMsg, setTrackMsg] = useState('')

  const pct = Math.min(100, Math.round((todaySteps / stepGoal) * 100))
  const kcal = stepsToKcal(todaySteps)
  const km = stepsToKm(todaySteps)
  const remaining = Math.max(0, stepGoal - todaySteps)
  const done = todaySteps >= stepGoal

  useEffect(() => {
    const id = setInterval(saveTodaySteps, 60000)
    return () => clearInterval(id)
  }, [])

  const handleManualAdd = () => {
    const n = parseInt(manualInput)
    if (!n || n < 1) return
    addSteps(n)
    setManualInput('')
    saveTodaySteps()
  }

  const handleTrack = async () => {
    if (isTracking) {
      stop(); saveTodaySteps(); setTrackMsg('')
    } else {
      const ok = await start()
      setTrackMsg(ok
        ? 'Sensor aktiv — Telefon in der Tasche tragen'
        : 'Sensorzugriff verweigert — bitte manuell eingeben'
      )
    }
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const log = stepDays.find(s => s.date === dateStr)
    return {
      label: d.toLocaleDateString('de-DE', { weekday: 'short' }),
      steps: log?.steps || (i === 6 ? todaySteps : 0),
    }
  })

  const avgSteps = Math.round(
    last7.filter(d => d.steps > 0).reduce((s, d) => s + d.steps, 0) /
    (last7.filter(d => d.steps > 0).length || 1)
  )

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg px-3 py-2 text-sm" style={{ background: C.bgTertiary, color: C.textPrimary }}>
        <div className="font-mono font-bold">{payload[0].value.toLocaleString()}</div>
        <div style={{ color: C.textTertiary }}>Schritte</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Main counter */}
      <div className="rounded-2xl p-5 border text-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>
          {done ? '🎉 Tagesziel erreicht!' : 'Heutige Schritte'}
        </div>

        <div className="text-6xl font-mono font-bold mb-1" style={{
          color: done ? C.success : C.textPrimary,
          fontFamily: '"IBM Plex Mono", monospace',
        }}>
          {todaySteps.toLocaleString()}
        </div>
        <div className="text-sm mb-4" style={{ color: C.textTertiary }}>
          von {stepGoal.toLocaleString()} Ziel
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 rounded-full overflow-hidden mb-1" style={{ background: C.bgTertiary }}>
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${pct}%`,
            background: done ? C.success : C.info,
          }} />
        </div>
        <div className="text-xs mb-4" style={{ color: C.textTertiary }}>
          {pct}% {remaining > 0 ? `· noch ${remaining.toLocaleString()}` : '· Ziel erreicht!'}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'km', value: km },
            { label: 'kcal', value: kcal },
            { label: 'Ø/Tag', value: avgSteps > 0 ? avgSteps.toLocaleString() : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl py-2.5" style={{ background: C.bgTertiary }}>
              <div className="font-mono font-bold text-lg">{value}</div>
              <div className="text-xs" style={{ color: C.textTertiary }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Sensor button */}
        <button onClick={handleTrack}
          className="w-full py-3 rounded-xl font-semibold text-white mb-2"
          style={{ background: isTracking ? C.danger : supported ? C.info : C.bgTertiary }}>
          {isTracking ? '⏹ Sensor stoppen' : supported ? '📱 Automatisch zählen' : '📱 Sensor nicht verfügbar'}
        </button>

        {trackMsg && (
          <p className="text-xs" style={{ color: isTracking ? C.success : C.warning }}>{trackMsg}</p>
        )}
        {!supported && (
          <p className="text-xs mt-1" style={{ color: C.textTertiary }}>
            Bitte Schritte manuell eingeben ↓
          </p>
        )}
      </div>

      {/* Quick set + manual */}
      <div className="rounded-2xl p-4 border space-y-3" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest" style={{ color: C.textTertiary }}>Schritte eingeben</div>

        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {QUICK.map(n => (
            <button key={n} onClick={() => { setSteps(n); saveTodaySteps() }}
              className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap border flex-shrink-0"
              style={{
                borderColor: todaySteps === n ? C.success : C.borderMedium,
                color: todaySteps === n ? C.success : C.textSecondary,
                background: todaySteps === n ? 'rgba(16,185,129,0.1)' : 'transparent',
              }}>
              {n >= 1000 ? `${n / 1000}k` : n}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input type="number" value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
            placeholder="Schritte hinzufügen..."
            className="flex-1 text-center font-mono"
          />
          <button onClick={handleManualAdd}
            className="px-5 py-2 rounded-xl font-bold text-white flex-shrink-0"
            style={{ background: manualInput ? C.info : C.bgTertiary }}>
            +
          </button>
        </div>

        <button onClick={() => { setSteps(0); saveTodaySteps() }}
          className="w-full py-2 rounded-xl text-sm border"
          style={{ borderColor: C.borderMedium, color: C.textTertiary }}>
          ↺ Zurücksetzen
        </button>
      </div>

      {/* Goal */}
      <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs uppercase tracking-widest" style={{ color: C.textTertiary }}>Tagesziel</div>
          <button onClick={() => setEditGoal(!editGoal)}
            className="text-xs border px-3 py-1 rounded-lg"
            style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
            {editGoal ? 'Fertig' : 'Ändern'}
          </button>
        </div>

        {editGoal ? (
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {[5000, 7500, 8000, 10000, 12000, 15000].map(g => (
                <button key={g} onClick={() => { setGoal(g); setGoalInput(String(g)); setEditGoal(false) }}
                  className="px-3 py-1.5 rounded-full text-xs border"
                  style={{
                    borderColor: stepGoal === g ? C.info : C.borderMedium,
                    color: stepGoal === g ? C.info : C.textSecondary,
                    background: stepGoal === g ? 'rgba(59,130,246,0.1)' : 'transparent',
                  }}>
                  {g.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="number" value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                placeholder="Eigenes Ziel..." className="flex-1 text-center font-mono" />
              <button onClick={() => { setGoal(parseInt(goalInput) || 8000); setEditGoal(false) }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: C.success }}>✓</button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl font-mono font-bold">{stepGoal.toLocaleString()}</div>
            <div className="text-xs mt-1" style={{ color: C.textTertiary }}>
              ≈ {stepsToKm(stepGoal)} km · {stepsToKcal(stepGoal)} kcal
            </div>
          </div>
        )}
      </div>

      {/* 7-day chart */}
      {last7.some(d => d.steps > 0) && (
        <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Letzte 7 Tage</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={last7}>
              <XAxis dataKey="label" tick={{ fill: C.textTertiary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textTertiary, fontSize: 10 }} axisLine={false} tickLine={false} width={36}
                tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={stepGoal} stroke={C.success} strokeDasharray="4 2" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="steps" stroke={C.info} strokeWidth={2}
                dot={{ fill: C.info, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs mt-1" style={{ color: C.textTertiary }}>
            ─ ─ Ziel {stepGoal.toLocaleString()} · Ø {avgSteps.toLocaleString()} Schritte/Tag
          </div>
        </div>
      )}

      {/* Motivation */}
      <div className="rounded-2xl p-3 border text-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <p className="text-sm" style={{ color: done ? C.success : C.textTertiary }}>
          {done
            ? `🎉 Super! ${kcal} kcal verbrannt · ${km} km gelaufen`
            : `Noch ${remaining.toLocaleString()} Schritte → ${stepsToKcal(remaining)} kcal · ${stepsToKm(remaining)} km`
          }
        </p>
      </div>

    </div>
  )
}
