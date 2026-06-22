import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { C } from '../../theme/colors'
import { calcBMR, calcTDEE, calcCalorieGoal, calcProteinGoal, calcDaysToGoal } from '../../utils/calculations'

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Wenig Bewegung', light: 'Leicht aktiv',
  moderate: 'Moderat aktiv', active: 'Sehr aktiv', very_active: 'Extrem aktiv',
}

export default function Settings() {
  const { user, setUser, logout } = useAuthStore()
  const { weightEntries, dayLogs, theme, setTheme, getStreak, meals } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    age: user?.age || 49,
    height_cm: user?.height_cm || 180,
    current_weight: user?.current_weight || 90,
    target_weight: user?.target_weight || 85,
    activity_level: user?.activity_level || 'moderate',
    water_goal: user?.water_goal || 2500,
  })

  const lastWeight = weightEntries.length ? weightEntries[weightEntries.length - 1].weight : form.current_weight
  const bmr = calcBMR(lastWeight, form.height_cm, form.age)
  const tdee = calcTDEE(bmr, form.activity_level)
  const calorieGoal = calcCalorieGoal(tdee)
  const proteinGoal = calcProteinGoal(lastWeight)
  const daysToGoal = calcDaysToGoal(lastWeight, form.target_weight)
  const streak = getStreak()

  // Weekly report
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const log = dayLogs.find(l => l.date === dateStr)
    const dayMeals = meals.filter(m => m.date === dateStr)
    const kcal = log?.calories || dayMeals.reduce((s, m) => s + m.calories, 0)
    return { date: dateStr, kcal, fasted: log?.fastingDone || false }
  })
  const avgKcal = Math.round(last7.filter(d => d.kcal > 0).reduce((s, d) => s + d.kcal, 0) / (last7.filter(d => d.kcal > 0).length || 1))
  const fastedDays = last7.filter(d => d.fasted).length

  const handleSave = () => {
    setUser({ ...form, protein_goal: proteinGoal })
    setEditing(false)
  }

  const shareText = `🔥 SEI Fasten-Update\n\n⚡ ${streak} Tage Streak\n⚖️ ${lastWeight}kg → Ziel: ${user?.target_weight}kg\n🍽 Ø ${avgKcal} kcal/Tag diese Woche\n⏱ ${fastedDays}/7 Tage gefastet\n\n清 SEI — Klar. Rein. Bewusst.\nhttps://sei-39t.pages.dev`

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'SEI Fasten', text: shareText })
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('In Zwischenablage kopiert!')
    }
  }

  return (
    <div className="space-y-4">

      {/* Theme toggle */}
      <div className="rounded-2xl p-4 border flex justify-between items-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div>
          <div className="font-medium text-sm">Design</div>
          <div className="text-xs mt-0.5" style={{ color: C.textTertiary }}>Hell / Dunkel Modus</div>
        </div>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="px-4 py-2 rounded-xl text-sm font-medium border"
          style={{ borderColor: C.borderMedium, color: C.textSecondary }}
        >
          {theme === 'dark' ? '☀️ Hell' : '🌙 Dunkel'}
        </button>
      </div>

      {/* Profile */}
      <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="font-semibold text-lg">{user?.name}</div>
            <div className="text-sm" style={{ color: C.textTertiary }}>{user?.email}</div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="px-3 py-1.5 rounded-lg text-sm border"
            style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
            {editing ? 'Abbrechen' : 'Bearbeiten'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Alter', 'age', 'number'],
                ['Größe (cm)', 'height_cm', 'number'],
                ['Gewicht (kg)', 'current_weight', 'number'],
                ['Ziel (kg)', 'target_weight', 'number'],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <label className="text-xs block mb-1" style={{ color: C.textTertiary }}>{label}</label>
                  <input type={type} value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: +e.target.value })} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: C.textTertiary }}>Aktivitätslevel</label>
              <select value={form.activity_level} onChange={e => setForm({ ...form, activity_level: e.target.value })}>
                {Object.entries(ACTIVITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: C.textTertiary }}>Wasserziel (ml)</label>
              <input type="number" step="100" value={form.water_goal}
                onChange={e => setForm({ ...form, water_goal: +e.target.value })} />
            </div>
            <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-white"
              style={{ background: C.success }}>✓ Speichern</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Alter', `${user?.age || '—'} Jahre`],
              ['Größe', `${user?.height_cm || '—'} cm`],
              ['Gewicht', `${lastWeight} kg`],
              ['Ziel', `${user?.target_weight || '—'} kg`],
              ['Aktivität', ACTIVITY_LABELS[user?.activity_level || ''] || '—'],
              ['Wasser', `${((user?.water_goal || 2500) / 1000).toFixed(1)} L`],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-xs mb-0.5" style={{ color: C.textTertiary }}>{l}</div>
                <div className="font-medium text-sm">{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Berechnungen</div>
        <div className="space-y-2.5">
          {[
            { l: 'BMR', v: `${bmr} kcal`, c: C.textPrimary },
            { l: 'TDEE', v: `${tdee} kcal`, c: C.textPrimary },
            { l: 'Kalorienziel (−500)', v: `${calorieGoal} kcal`, c: C.success },
            { l: 'Proteinziel', v: `${proteinGoal} g`, c: C.info },
            { l: 'Tage bis Ziel', v: `~${daysToGoal} Tage`, c: C.warning },
          ].map(({ l, v, c }) => (
            <div key={l} className="flex justify-between items-center">
              <span className="text-sm" style={{ color: C.textSecondary }}>{l}</span>
              <span className="font-mono font-bold text-sm" style={{ color: c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Report */}
      <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Wochenbericht</div>
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div>
            <div className="text-2xl font-bold" style={{ color: C.warning }}>🔥{streak}</div>
            <div className="text-xs" style={{ color: C.textTertiary }}>Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono" style={{ color: C.success }}>{fastedDays}/7</div>
            <div className="text-xs" style={{ color: C.textTertiary }}>Fastentage</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono">{avgKcal}</div>
            <div className="text-xs" style={{ color: C.textTertiary }}>Ø kcal/Tag</div>
          </div>
        </div>
        <button onClick={handleShare}
          className="w-full py-2.5 rounded-xl text-sm font-semibold border"
          style={{ borderColor: C.info, color: C.info }}>
          📤 Ergebnisse teilen
        </button>
      </div>

      {/* About */}
      <div className="rounded-2xl p-4 border text-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-2xl mb-1" style={{ fontFamily: '"IBM Plex Serif", serif' }}>清 SEI</div>
        <div className="text-xs" style={{ color: C.textTertiary }}>v1.1.0 · Klar. Rein. Bewusst.</div>
        <div className="text-xs mt-1" style={{ color: C.textTertiary }}>Made with ♥ by Hasi Elektronic</div>
      </div>

      <button onClick={logout} className="w-full py-3 rounded-xl font-medium border"
        style={{ borderColor: C.danger, color: C.danger }}>
        Abmelden
      </button>
    </div>
  )
}
