import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { C } from '../../theme/colors'
import { calcBMR, calcTDEE, calcCalorieGoal, calcProteinGoal } from '../../utils/calculations'

const ACTIVITY_LEVELS = [
  { key: 'sedentary',   label: 'Wenig Bewegung',  desc: 'Bürojob, kein Sport' },
  { key: 'light',       label: 'Leicht aktiv',     desc: '1–2× Sport / Woche' },
  { key: 'moderate',    label: 'Moderat aktiv',    desc: '3–5× Sport / Woche' },
  { key: 'active',      label: 'Sehr aktiv',       desc: 'Täglich Sport' },
  { key: 'very_active', label: 'Extrem aktiv',     desc: 'Profi / Bauarbeiter' },
]

export default function Onboard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [age, setAge] = useState(49)
  const [height, setHeight] = useState(180)
  const [currentW, setCurrentW] = useState(94)
  const [targetW, setTargetW] = useState(85)
  const [activity, setActivity] = useState('moderate')
  const { setUser, setOnboardDone } = useAuthStore()

  const handleFinish = () => {
    const bmr = calcBMR(currentW, height, age)
    const tdee = calcTDEE(bmr, activity)
    setUser({
      age,
      height_cm: height,
      current_weight: currentW,
      target_weight: targetW,
      activity_level: activity,
      protein_goal: calcProteinGoal(currentW),
      water_goal: 2500,
    })
    setOnboardDone()
    onComplete()
  }

  const progress = (step / 4) * 100

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bgPrimary }}>
      <div className="w-full max-w-sm rounded-2xl p-6 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Schritt {step} / 4</span>
            <span className="text-xs" style={{ color: C.textTertiary }}>清 SEI</span>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: C.bgTertiary }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: C.success }} />
          </div>
        </div>

        {/* Step 1: Age */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ fontFamily: '"IBM Plex Serif", serif' }}>Wie alt bist du?</h2>
            <div>
              <input type="number" value={age} min={18} max={100} onChange={e => setAge(+e.target.value)} className="text-center text-3xl font-mono py-4" />
              <p className="text-center text-sm mt-2" style={{ color: C.textTertiary }}>Jahre</p>
            </div>
          </div>
        )}

        {/* Step 2: Height */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ fontFamily: '"IBM Plex Serif", serif' }}>Wie groß bist du?</h2>
            <div>
              <input type="number" value={height} min={140} max={220} onChange={e => setHeight(+e.target.value)} className="text-center text-3xl font-mono py-4" />
              <p className="text-center text-sm mt-2" style={{ color: C.textTertiary }}>cm</p>
            </div>
          </div>
        )}

        {/* Step 3: Weight */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ fontFamily: '"IBM Plex Serif", serif' }}>Dein Gewicht</h2>
            <div>
              <label className="text-sm block mb-1" style={{ color: C.textSecondary }}>Aktuell (kg)</label>
              <input type="number" step="0.1" value={currentW} onChange={e => setCurrentW(+e.target.value)} className="text-center text-2xl font-mono" />
            </div>
            <div>
              <label className="text-sm block mb-1" style={{ color: C.textSecondary }}>Ziel (kg)</label>
              <input type="number" step="0.1" value={targetW} onChange={e => setTargetW(+e.target.value)} className="text-center text-2xl font-mono" />
            </div>
            {currentW > targetW && (
              <p className="text-sm text-center" style={{ color: C.success }}>
                Zu verlieren: {(currentW - targetW).toFixed(1)} kg
                → ~{Math.round(((currentW - targetW) / 0.25) * 7)} Tage
              </p>
            )}
          </div>
        )}

        {/* Step 4: Activity */}
        {step === 4 && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: '"IBM Plex Serif", serif' }}>Aktivitätslevel</h2>
            {ACTIVITY_LEVELS.map(lv => (
              <button
                key={lv.key}
                onClick={() => setActivity(lv.key)}
                className="w-full text-left p-3 rounded-xl border transition-all"
                style={{
                  background: activity === lv.key ? 'rgba(16,185,129,0.15)' : C.bgTertiary,
                  borderColor: activity === lv.key ? C.success : 'transparent',
                }}
              >
                <div className="font-medium text-sm">{lv.label}</div>
                <div className="text-xs mt-0.5" style={{ color: C.textTertiary }}>{lv.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl font-medium border"
              style={{ borderColor: C.borderMedium, color: C.textSecondary }}
            >
              Zurück
            </button>
          )}
          <button
            onClick={step < 4 ? () => setStep(s => s + 1) : handleFinish}
            className="flex-1 py-3 rounded-xl font-medium text-white"
            style={{ background: step === 4 ? C.success : C.info }}
          >
            {step === 4 ? '✓ Fertig' : 'Weiter'}
          </button>
        </div>
      </div>
    </div>
  )
}
