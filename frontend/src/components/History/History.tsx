import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { useStepsStore } from '../../store/stepsStore'
import { useSleepStore } from '../../store/sleepStore'
import { useAuthStore } from '../../store/authStore'
import { C } from '../../theme/colors'
import { calcBMR, calcTDEE, calcCalorieGoal, calcProteinGoal } from '../../utils/calculations'
import { calcHealthScore, scoreColor } from '../../utils/healthScore'

const pad = (n: number) => String(n).padStart(2, '0')

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

// Get all dates for a given month
function getDaysInMonth(year: number, month: number) {
  const days: string[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    days.push(isoDate(new Date(d)))
    d.setDate(d.getDate() + 1)
  }
  return days
}

// First weekday of month (Mon=0)
function firstWeekday(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export default function History() {
  const today = isoDate(new Date())
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [selected, setSelected] = useState<string | null>(today)
  const [weekMode, setWeekMode] = useState(false)

  const { user } = useAuthStore()
  const { meals, dayLogs, weightEntries } = useAppStore()
  const { stepDays } = useStepsStore()
  const { entries: sleepEntries } = useSleepStore()

  const w = user?.current_weight || 90
  const h = user?.height_cm || 175
  const a = user?.age || 45
  const act = user?.activity_level || 'moderate'
  const calorieGoal = calcCalorieGoal(calcTDEE(calcBMR(w, h, a), act))
  const proteinGoal = calcProteinGoal(w)
  const waterGoal = user?.water_goal || 2500
  const stepGoal = 8000

  // Get day data
  function getDayData(date: string) {
    const dayMeals = meals.filter(m => m.date === date)
    const log = dayLogs.find(l => l.date === date)
    const calories = log?.calories || dayMeals.reduce((s, m) => s + m.calories, 0)
    const protein = log?.protein || dayMeals.reduce((s, m) => s + m.protein, 0)
    const water = log?.water_ml || 0
    const stepDay = stepDays.find(s => s.date === date)
    const steps = stepDay?.steps || 0
    const sleep = sleepEntries.find(e => e.date === date)
    const weight = weightEntries.filter(e => e.date === date).slice(-1)[0]
    const fasted = log?.fastingDone || false
    const fastingMins = log?.fastingMinutes || 0

    const score = calcHealthScore({
      calories, calorieGoal, protein, proteinGoal,
      waterMl: water, waterGoal,
      fastingElapsed: fastingMins * 60,
      steps, stepGoal,
      sleep,
      medsTaken: 0, medsTotal: 0,
    })

    return { calories, protein, water, steps, sleep, weight, fasted, fastingMins, score, dayMeals }
  }

  // Calendar
  const days = getDaysInMonth(viewYear, viewMonth)
  const offset = firstWeekday(viewYear, viewMonth)
  const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  // Weekly report: current or selected week
  function getWeekDates(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1
    const monday = new Date(d)
    monday.setDate(d.getDate() - day)
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(monday)
      dd.setDate(monday.getDate() + i)
      return isoDate(dd)
    })
  }

  const weekDates = getWeekDates(selected || today)
  const weekData = weekDates.map(date => ({ date, ...getDayData(date) }))
  const avgKcal = Math.round(weekData.filter(d => d.calories > 0).reduce((s, d) => s + d.calories, 0) / (weekData.filter(d => d.calories > 0).length || 1))
  const avgProt = Math.round(weekData.filter(d => d.protein > 0).reduce((s, d) => s + d.protein, 0) / (weekData.filter(d => d.protein > 0).length || 1))
  const avgSteps = Math.round(weekData.filter(d => d.steps > 0).reduce((s, d) => s + d.steps, 0) / (weekData.filter(d => d.steps > 0).length || 1))
  const fastedDays = weekData.filter(d => d.fasted).length
  const avgScore = Math.round(weekData.reduce((s, d) => s + d.score.total, 0) / 7)
  const avgSleep = +(weekData.filter(d => d.sleep).reduce((s, d) => s + (d.sleep?.durationH || 0), 0) / (weekData.filter(d => d.sleep).length || 1)).toFixed(1)

  // Selected day data
  const sel = selected ? getDayData(selected) : null

  return (
    <div className="space-y-4">

      {/* Mode toggle */}
      <div className="flex rounded-2xl overflow-hidden border" style={{ borderColor: C.borderLight }}>
        {[
          { id: false, label: '📅 Kalender' },
          { id: true,  label: '📊 Wochenbericht' },
        ].map(m => (
          <button key={String(m.id)} onClick={() => setWeekMode(m.id)}
            className="flex-1 py-2.5 text-sm font-medium"
            style={{
              background: weekMode === m.id ? C.info : C.bgSecondary,
              color: weekMode === m.id ? '#fff' : C.textSecondary,
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* ─── CALENDAR ─── */}
      {!weekMode && (
        <>
          <div className="rounded-2xl border overflow-hidden" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
            {/* Month nav */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.borderLight }}>
              <button onClick={prevMonth} className="text-lg px-2" style={{ color: C.textSecondary }}>‹</button>
              <span className="font-semibold text-sm">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="text-lg px-2" style={{ color: C.textSecondary }}>›</button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center py-2 border-b" style={{ borderColor: C.borderLight }}>
              {WEEKDAYS.map(d => (
                <div key={d} className="text-xs font-medium" style={{ color: C.textTertiary }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-px p-2" style={{ background: C.bgTertiary }}>
              {/* Offset empty cells */}
              {Array.from({ length: offset }, (_, i) => (
                <div key={`e${i}`} className="rounded-lg" style={{ background: C.bgSecondary, aspectRatio: '1' }} />
              ))}

              {days.map(date => {
                const data = getDayData(date)
                const isTod = date === today
                const isSel = date === selected
                const hasSomething = data.calories > 0 || data.fasted || data.steps > 0
                const sc = data.score.total
                const dotColor = data.fasted ? C.success : hasSomething ? C.info : 'transparent'

                return (
                  <button key={date}
                    onClick={() => setSelected(date)}
                    className="rounded-lg flex flex-col items-center justify-center relative"
                    style={{
                      background: isSel ? C.info : isTod ? 'rgba(59,130,246,0.15)' : C.bgSecondary,
                      aspectRatio: '1',
                      border: isTod && !isSel ? `1.5px solid ${C.info}` : '1.5px solid transparent',
                    }}>
                    <span className="text-xs font-medium" style={{ color: isSel ? '#fff' : C.textPrimary }}>
                      {new Date(date + 'T12:00:00').getDate()}
                    </span>
                    {hasSomething && (
                      <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: isSel ? 'rgba(255,255,255,0.7)' : dotColor }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs px-1" style={{ color: C.textTertiary }}>
            <span>🔵 Heute</span>
            <span style={{ color: C.success }}>● Gefastet</span>
            <span style={{ color: C.info }}>● Daten vorhanden</span>
          </div>

          {/* Selected day detail */}
          {selected && sel && (
            <div className="rounded-2xl border overflow-hidden" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
              {/* Header */}
              <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: C.borderLight }}>
                <span className="font-semibold">{formatDate(selected)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: scoreColor(sel.score.total) + '20', color: scoreColor(sel.score.total) }}>
                    {sel.score.total}
                  </div>
                  {sel.fasted && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: C.success }}>⏱ Gefastet</span>}
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Kalorien', value: sel.calories > 0 ? `${sel.calories} kcal` : '—', color: sel.calories > 0 ? C.success : C.textTertiary },
                    { label: 'Protein', value: sel.protein > 0 ? `${sel.protein}g` : '—', color: sel.protein > 0 ? C.info : C.textTertiary },
                    { label: 'Schritte', value: sel.steps > 0 ? sel.steps.toLocaleString() : '—', color: sel.steps >= stepGoal ? C.success : C.textTertiary },
                    { label: 'Schlaf', value: sel.sleep ? `${sel.sleep.durationH}h` : '—', color: sel.sleep ? (sel.sleep.durationH >= 7 ? C.success : C.warning) : C.textTertiary },
                    { label: 'Gewicht', value: sel.weight ? `${sel.weight.weight} kg` : '—', color: C.textPrimary },
                    { label: 'Wasser', value: sel.water > 0 ? `${(sel.water/1000).toFixed(1)}L` : '—', color: C.textTertiary },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: C.bgTertiary }}>
                      <div className="text-xs mb-1" style={{ color: C.textTertiary }}>{label}</div>
                      <div className="font-mono font-bold" style={{ color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Meals list */}
                {sel.dayMeals.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Mahlzeiten</div>
                    <div className="space-y-1">
                      {sel.dayMeals.map(m => (
                        <div key={m.id} className="flex justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: C.borderLight }}>
                          <span>{m.food_name} <span style={{ color: C.textTertiary }}>({m.grams}g)</span></span>
                          <span className="font-mono text-xs" style={{ color: C.textSecondary }}>{m.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!sel.calories && !sel.fasted && !sel.steps && (
                  <p className="text-sm text-center py-2" style={{ color: C.textTertiary }}>
                    Keine Daten für diesen Tag
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── WEEKLY REPORT ─── */}
      {weekMode && (
        <div className="space-y-4">
          {/* Week header */}
          <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.textTertiary }}>
              Woche von
            </div>
            <div className="font-semibold">
              {formatDate(weekDates[0])} – {formatDate(weekDates[6])}
            </div>
          </div>

          {/* Weekly stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📊', label: 'Ø Score', value: avgScore, color: scoreColor(avgScore), suffix: '/100' },
              { icon: '⏱', label: 'Fastentage', value: fastedDays, color: C.success, suffix: '/7' },
              { icon: '🍽', label: 'Ø Kalorien', value: avgKcal > 0 ? avgKcal : '—', color: C.info, suffix: avgKcal > 0 ? ' kcal' : '' },
              { icon: '💪', label: 'Ø Protein', value: avgProt > 0 ? avgProt : '—', color: C.info, suffix: avgProt > 0 ? 'g' : '' },
              { icon: '👟', label: 'Ø Schritte', value: avgSteps > 0 ? avgSteps.toLocaleString() : '—', color: avgSteps >= stepGoal ? C.success : C.warning, suffix: '' },
              { icon: '😴', label: 'Ø Schlaf', value: avgSleep > 0 ? avgSleep : '—', color: avgSleep >= 7 ? C.success : C.warning, suffix: avgSleep > 0 ? 'h' : '' },
            ].map(({ icon, label, value, color, suffix }) => (
              <div key={label} className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
                <div className="text-lg mb-1">{icon}</div>
                <div className="font-mono font-bold text-xl" style={{ color }}>{value}{suffix}</div>
                <div className="text-xs mt-0.5" style={{ color: C.textTertiary }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Day-by-day table */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
            <div className="px-4 py-3 border-b text-xs uppercase tracking-widest" style={{ borderColor: C.borderLight, color: C.textTertiary }}>
              Tagesübersicht
            </div>
            {weekData.map(day => {
              const isToday = day.date === today
              return (
                <div key={day.date}
                  className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                  style={{
                    borderColor: C.borderLight,
                    background: isToday ? 'rgba(59,130,246,0.05)' : 'transparent',
                  }}>
                  {/* Day label */}
                  <div className="w-10 flex-shrink-0">
                    <div className="text-xs font-medium" style={{ color: isToday ? C.info : C.textSecondary }}>
                      {new Date(day.date + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short' })}
                    </div>
                    <div className="text-xs" style={{ color: C.textTertiary }}>
                      {new Date(day.date + 'T12:00:00').getDate()}.
                    </div>
                  </div>

                  {/* Score circle */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: day.score.total > 0 ? scoreColor(day.score.total) + '20' : C.bgTertiary,
                      color: day.score.total > 0 ? scoreColor(day.score.total) : C.textTertiary,
                    }}>
                    {day.score.total > 0 ? day.score.total : '—'}
                  </div>

                  {/* Mini stats */}
                  <div className="flex-1 grid grid-cols-4 gap-1 text-center">
                    {[
                      { val: day.calories > 0 ? `${Math.round(day.calories/100)*100}` : '—', label: 'kcal' },
                      { val: day.fasted ? '✓' : '—', label: 'fast' },
                      { val: day.steps > 0 ? `${Math.round(day.steps/1000)}k` : '—', label: 'step' },
                      { val: day.sleep ? `${day.sleep.durationH}h` : '—', label: 'sleep' },
                    ].map(({ val, label }) => (
                      <div key={label}>
                        <div className="text-xs font-mono font-medium" style={{
                          color: val === '✓' ? C.success : val === '—' ? C.textTertiary : C.textPrimary,
                        }}>{val}</div>
                        <div style={{ fontSize: 9, color: C.textTertiary }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Click to select */}
                  <button onClick={() => { setSelected(day.date); setWeekMode(false) }}
                    className="text-xs flex-shrink-0"
                    style={{ color: C.textTertiary }}>
                    ›
                  </button>
                </div>
              )
            })}
          </div>

          {/* Week navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const d = new Date(weekDates[0] + 'T12:00:00')
                d.setDate(d.getDate() - 7)
                setSelected(isoDate(d))
              }}
              className="flex-1 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
              ‹ Vorwoche
            </button>
            <button
              onClick={() => setSelected(today)}
              className="flex-1 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
              Diese Woche
            </button>
            <button
              onClick={() => {
                const d = new Date(weekDates[6] + 'T12:00:00')
                d.setDate(d.getDate() + 1)
                if (isoDate(d) <= today) setSelected(isoDate(d))
              }}
              className="flex-1 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
              Nächste ›
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
