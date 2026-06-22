import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { useFastingTimer } from '../../hooks/useFastingTimer'
import { C } from '../../theme/colors'
import { calcBMR, calcTDEE, calcCalorieGoal, calcProteinGoal, calcDaysToGoal } from '../../utils/calculations'

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.bgTertiary }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { water_ml, addWater, setWater, todayCalories, todayProtein, weightEntries, getStreak, dayLogs, meals } = useAppStore()
  const { fastingActive, elapsed, remaining, progress, isComplete, elapsedFormatted, remainingFormatted, toggleFasting } = useFastingTimer()

  const w = user?.current_weight || 90
  const h = user?.height_cm || 175
  const a = user?.age || 45
  const act = user?.activity_level || 'moderate'
  const calorieGoal = calcCalorieGoal(calcTDEE(calcBMR(w, h, a), act))
  const proteinGoal = calcProteinGoal(w)
  const waterGoal = user?.water_goal || 2500
  const calories = todayCalories()
  const protein = todayProtein()
  const lastWeight = weightEntries.length ? weightEntries[weightEntries.length - 1].weight : w
  const daysToGoal = calcDaysToGoal(lastWeight, user?.target_weight || 85)
  const streak = getStreak()

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Water reminder every 2h (simple interval)
  useEffect(() => {
    const interval = setInterval(() => {
      if (water_ml < waterGoal && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('清 SEI — Wasser trinken! 💧', {
          body: `Noch ${((waterGoal - water_ml) / 1000).toFixed(1)}L bis zu deinem Ziel.`,
          icon: '/favicon.svg',
        })
      }
    }, 2 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [water_ml, waterGoal])

  // History: last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const log = dayLogs.find(l => l.date === dateStr)
    const dayMeals = meals.filter(m => m.date === dateStr)
    const kcal = log ? log.calories : dayMeals.reduce((s, m) => s + m.calories, 0)
    return {
      date: dateStr,
      label: d.toLocaleDateString('de-DE', { weekday: 'short' }),
      kcal,
      fasted: log?.fastingDone || false,
    }
  })

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl border" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="text-sm font-semibold" style={{ color: C.warning }}>{streak} Tage Streak</span>
          </div>
          <span className="text-xs" style={{ color: C.textTertiary }}>Weiter so!</span>
        </div>
      )}

      {/* Fasting Timer */}
      <div className="rounded-2xl p-5 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-center mb-4">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>
            {fastingActive ? (isComplete ? '✓ Ziel erreicht!' : 'Fasten aktiv') : 'Fasten pausiert'}
          </div>
          <div className="text-5xl font-mono font-bold tracking-tight" style={{
            color: isComplete ? C.success : fastingActive ? C.textPrimary : C.textTertiary,
            fontFamily: '"IBM Plex Mono", monospace',
          }}>
            {fastingActive ? elapsedFormatted : '00:00:00'}
          </div>
          {fastingActive && !isComplete && (
            <div className="text-sm mt-1" style={{ color: C.textTertiary }}>
              Noch {remainingFormatted} bis 20h
            </div>
          )}
        </div>

        {/* Progress arc as bar */}
        <div className="relative w-full h-2 rounded-full mb-4 overflow-hidden" style={{ background: C.bgTertiary }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{
            width: `${progress}%`,
            background: isComplete ? C.success : C.info,
          }} />
        </div>

        <button onClick={toggleFasting} className="w-full py-3 rounded-xl font-semibold text-white"
          style={{ background: fastingActive ? C.danger : C.success }}>
          {fastingActive ? '⏹ Fasten beenden' : '▶ Fasten starten'}
        </button>
      </div>

      {/* Macros */}
      <div className="rounded-2xl p-4 border space-y-4" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest" style={{ color: C.textTertiary }}>Heute</div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium">Kalorien</span>
            <span className="font-mono text-sm" style={{ color: C.textSecondary }}>
              {calories} / {calorieGoal} kcal
            </span>
          </div>
          <Bar value={calories} max={calorieGoal} color={calories > calorieGoal ? C.danger : C.success} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium">Protein</span>
            <span className="font-mono text-sm" style={{ color: C.textSecondary }}>{protein} / {proteinGoal}g</span>
          </div>
          <Bar value={protein} max={proteinGoal} color={C.info} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium">Wasser</span>
            <span className="font-mono text-sm" style={{ color: C.textSecondary }}>
              {(water_ml / 1000).toFixed(1)} / {(waterGoal / 1000).toFixed(1)} L
            </span>
          </div>
          <Bar value={water_ml} max={waterGoal} color="#38BDF8" />
          <div className="flex gap-2 mt-2">
            {[200, 250, 500].map(ml => (
              <button key={ml} onClick={() => addWater(ml)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
                style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
                +{ml}ml
              </button>
            ))}
            <button onClick={() => setWater(0)}
              className="px-3 py-1.5 rounded-lg text-xs border"
              style={{ borderColor: C.borderMedium, color: C.textTertiary }}>
              ↺
            </button>
          </div>
        </div>
      </div>

      {/* Weight + Goal */}
      <div className="rounded-2xl p-4 border flex justify-between items-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div>
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.textTertiary }}>Gewicht</div>
          <div className="text-3xl font-mono font-bold">{lastWeight} <span className="text-lg font-normal">kg</span></div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.textTertiary }}>Ziel</div>
          <div className="text-xl font-mono">{user?.target_weight || 85} kg</div>
          {daysToGoal > 0
            ? <div className="text-xs mt-1" style={{ color: C.success }}>~{daysToGoal} Tage</div>
            : <div className="text-xs mt-1" style={{ color: C.success }}>✓ Erreicht!</div>
          }
        </div>
      </div>

      {/* 7-Day History */}
      <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Letzte 7 Tage</div>
        <div className="flex justify-between gap-1">
          {last7.map(day => {
            const isToday = day.date === todayStr
            const pct = day.kcal > 0 ? Math.min(100, (day.kcal / calorieGoal) * 100) : 0
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                {/* Bar */}
                <div className="w-full flex flex-col-reverse" style={{ height: 48 }}>
                  <div className="w-full rounded-t-sm transition-all" style={{
                    height: `${pct}%`,
                    background: isToday ? C.info : day.fasted ? C.success : C.bgTertiary,
                    minHeight: day.kcal > 0 ? 4 : 0,
                  }} />
                </div>
                {/* Fasting dot */}
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: day.fasted ? C.success : C.bgTertiary,
                }} />
                {/* Label */}
                <div className="text-xs" style={{ color: isToday ? C.textPrimary : C.textTertiary, fontWeight: isToday ? 600 : 400 }}>
                  {day.label}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-2 text-xs" style={{ color: C.textTertiary }}>
          <span>🟦 Heute · </span>
          <span style={{ color: C.success }}>● Fasten ✓</span>
        </div>
      </div>

    </div>
  )
}
