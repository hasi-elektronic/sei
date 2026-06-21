import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { C } from '../../theme/colors'
import { calcBMR, calcTDEE, calcCalorieGoal, calcProteinGoal, calcDaysToGoal } from '../../utils/calculations'

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Wenig Bewegung',
  light: 'Leicht aktiv',
  moderate: 'Moderat aktiv',
  active: 'Sehr aktiv',
  very_active: 'Extrem aktiv',
}

export default function Settings() {
  const { user, setUser, logout } = useAuthStore()
  const { weightEntries } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    age: user?.age || 49,
    height_cm: user?.height_cm || 180,
    current_weight: user?.current_weight || 90,
    target_weight: user?.target_weight || 85,
    activity_level: user?.activity_level || 'moderate',
    water_goal: user?.water_goal || 2500,
  })

  const lastWeight = weightEntries.length > 0
    ? weightEntries[weightEntries.length - 1].weight
    : form.current_weight

  const bmr = calcBMR(lastWeight, form.height_cm, form.age)
  const tdee = calcTDEE(bmr, form.activity_level)
  const calorieGoal = calcCalorieGoal(tdee)
  const proteinGoal = calcProteinGoal(lastWeight)
  const daysToGoal = calcDaysToGoal(lastWeight, form.target_weight)

  const handleSave = () => {
    setUser({ ...form, protein_goal: proteinGoal })
    setEditing(false)
  }

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="font-semibold text-lg">{user?.name}</div>
            <div className="text-sm" style={{ color: C.textTertiary }}>{user?.email}</div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-1.5 rounded-lg text-sm border"
            style={{ borderColor: C.borderMedium, color: C.textSecondary }}
          >
            {editing ? 'Abbrechen' : 'Bearbeiten'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: C.textTertiary }}>Alter</label>
                <input type="number" value={form.age} onChange={e => setForm({ ...form, age: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: C.textTertiary }}>Größe (cm)</label>
                <input type="number" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: C.textTertiary }}>Gewicht (kg)</label>
                <input type="number" step="0.1" value={form.current_weight} onChange={e => setForm({ ...form, current_weight: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: C.textTertiary }}>Ziel (kg)</label>
                <input type="number" step="0.1" value={form.target_weight} onChange={e => setForm({ ...form, target_weight: +e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: C.textTertiary }}>Aktivitätslevel</label>
              <select value={form.activity_level} onChange={e => setForm({ ...form, activity_level: e.target.value })}>
                <option value="sedentary">Wenig Bewegung</option>
                <option value="light">Leicht aktiv</option>
                <option value="moderate">Moderat aktiv</option>
                <option value="active">Sehr aktiv</option>
                <option value="very_active">Extrem aktiv</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: C.textTertiary }}>Wasserziel (ml)</label>
              <input type="number" step="100" value={form.water_goal} onChange={e => setForm({ ...form, water_goal: +e.target.value })} />
            </div>
            <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.success }}>
              ✓ Speichern
            </button>
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
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-xs mb-0.5" style={{ color: C.textTertiary }}>{label}</div>
                <div className="font-medium text-sm">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Card */}
      <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Berechnungen</div>
        <div className="space-y-3">
          {[
            { label: 'BMR (Grundumsatz)', value: `${bmr} kcal`, color: C.textPrimary },
            { label: 'TDEE (Gesamtumsatz)', value: `${tdee} kcal`, color: C.textPrimary },
            { label: 'Kalorienziel (−500)', value: `${calorieGoal} kcal`, color: C.success },
            { label: 'Proteinziel', value: `${proteinGoal} g`, color: C.info },
            { label: 'Tage bis Ziel', value: `~${daysToGoal} Tage`, color: C.warning },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-sm" style={{ color: C.textSecondary }}>{label}</span>
              <span className="font-mono font-bold text-sm" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* About SEI */}
      <div className="rounded-2xl p-4 border text-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-2xl mb-1" style={{ fontFamily: '"IBM Plex Serif", serif' }}>清 SEI</div>
        <div className="text-xs" style={{ color: C.textTertiary }}>v1.0.0 · Klar. Rein. Bewusst.</div>
        <div className="text-xs mt-1" style={{ color: C.textTertiary }}>Made with ♥ by Hasi Elektronic</div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-xl font-medium border"
        style={{ borderColor: C.danger, color: C.danger }}
      >
        Abmelden
      </button>
    </div>
  )
}
