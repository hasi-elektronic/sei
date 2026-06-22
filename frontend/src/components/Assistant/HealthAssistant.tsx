import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { useStepsStore } from '../../store/stepsStore'
import { useSleepStore } from '../../store/sleepStore'
import { useMedicStore } from '../../store/medicStore'
import { useFastingTimer } from '../../hooks/useFastingTimer'
import { calcHealthScore, scoreColor, scoreLabel } from '../../utils/healthScore'
import { calcBMR, calcTDEE, calcCalorieGoal, calcProteinGoal } from '../../utils/calculations'
import { C } from '../../theme/colors'

const today = () => new Date().toISOString().split('T')[0]
const QUALITY_LABELS = ['', '😩 Schlecht', '😔 Mäßig', '😐 Ok', '😊 Gut', '😄 Super']
const MED_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke={C.bgTertiary} strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 65 65)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="65" y="60" textAnchor="middle" fill={color}
        style={{ fontFamily: '"IBM Plex Mono"', fontSize: 28, fontWeight: 700 }}>{score}</text>
      <text x="65" y="78" textAnchor="middle" fill={C.textTertiary}
        style={{ fontSize: 11 }}>/ 100</text>
    </svg>
  )
}

export default function HealthAssistant() {
  const { user } = useAuthStore()
  const { todayCalories, todayProtein, water_ml } = useAppStore()
  const { todaySteps, stepGoal } = useStepsStore()
  const { entries: sleepEntries, addEntry: addSleep } = useSleepStore()
  const { meds, logs, addMed, removeMed, toggleTaken, isTaken } = useMedicStore()
  const { elapsed } = useFastingTimer()
  const [tab, setTab] = useState<'score' | 'sleep' | 'meds'>('score')
  const [showAddMed, setShowAddMed] = useState(false)
  const [showAddSleep, setShowAddSleep] = useState(false)

  // Sleep form
  const [bedtime, setBedtime] = useState('22:30')
  const [wakeTime, setWakeTime] = useState('06:30')
  const [quality, setQuality] = useState<1|2|3|4|5>(4)

  // Med form
  const [medName, setMedName] = useState('')
  const [medDose, setMedDose] = useState('')
  const [medTime, setMedTime] = useState('08:00')
  const [medColorIdx, setMedColorIdx] = useState(0)

  const t = today()
  const w = user?.current_weight || 90
  const h = user?.height_cm || 175
  const a = user?.age || 45
  const act = user?.activity_level || 'moderate'
  const calorieGoal = calcCalorieGoal(calcTDEE(calcBMR(w, h, a), act))
  const proteinGoal = calcProteinGoal(w)
  const waterGoal = user?.water_goal || 2500
  const todaySleep = sleepEntries.find(e => e.date === t)
  const medsTaken = meds.filter(m => m.active && isTaken(m.id, t)).length
  const medsTotal = meds.filter(m => m.active).length

  const score = calcHealthScore({
    calories: todayCalories(),
    calorieGoal,
    protein: todayProtein(),
    proteinGoal,
    waterMl: water_ml,
    waterGoal,
    fastingElapsed: elapsed,
    steps: todaySteps,
    stepGoal,
    sleep: todaySleep,
    medsTaken,
    medsTotal,
  })

  const color = scoreColor(score.total)

  // AI-style tips based on weakest area
  const tips: string[] = []
  if (score.fasting < 15) tips.push('⏱ Fasten noch nicht gestartet — starte jetzt für deinen Streak')
  if (score.nutrition < 15) tips.push(`🍽 Protein niedrig (${todayProtein()}g) — Huhn Brust oder Lachs zum Mittag`)
  if (score.hydration < 10) tips.push(`💧 Wasser: ${(water_ml/1000).toFixed(1)}L — noch ${((waterGoal-water_ml)/1000).toFixed(1)}L trinken`)
  if (score.activity < 12) tips.push(`👟 Schritte: ${todaySteps.toLocaleString()} — noch ${(stepGoal-todaySteps).toLocaleString()} bis Ziel`)
  if (!todaySleep) tips.push('😴 Uyku henüz kaydedilmedi — ekle')
  if (medsTotal > 0 && medsTaken < medsTotal) tips.push(`💊 ${medsTotal - medsTaken} Medikament noch nicht genommen`)
  if (tips.length === 0) tips.push('🎉 Alles im grünen Bereich — weiter so!')

  const calcSleepDuration = (bed: string, wake: string) => {
    const [bh, bm] = bed.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    let mins = (wh * 60 + wm) - (bh * 60 + bm)
    if (mins < 0) mins += 24 * 60
    return +(mins / 60).toFixed(1)
  }

  const handleAddSleep = () => {
    const durationH = calcSleepDuration(bedtime, wakeTime)
    addSleep({ date: t, bedtime, wakeTime, durationH, quality })
    setShowAddSleep(false)
  }

  const handleAddMed = () => {
    if (!medName.trim()) return
    addMed({ name: medName, dose: medDose, time: medTime, color: MED_COLORS[medColorIdx], active: true })
    setMedName(''); setMedDose(''); setMedTime('08:00')
    setShowAddMed(false)
  }

  const TABS = [
    { id: 'score', label: '📊 Score' },
    { id: 'sleep', label: '😴 Schlaf' },
    { id: 'meds',  label: '💊 Medis' },
  ]

  return (
    <div className="space-y-4">

      {/* Tab bar */}
      <div className="flex rounded-2xl overflow-hidden border" style={{ borderColor: C.borderLight }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id as any)}
            className="flex-1 py-2.5 text-sm font-medium transition-all"
            style={{
              background: tab === tb.id ? C.info : C.bgSecondary,
              color: tab === tb.id ? '#fff' : C.textSecondary,
            }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ─── SCORE TAB ─── */}
      {tab === 'score' && (
        <div className="space-y-4">
          {/* Main score */}
          <div className="rounded-2xl p-5 border text-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>
              Heutiger Gesundheitsscore
            </div>
            <div className="flex justify-center mb-2">
              <ScoreRing score={score.total} color={color} />
            </div>
            <div className="text-lg font-semibold mb-1" style={{ color }}>{scoreLabel(score.total)}</div>
            <div className="text-xs" style={{ color: C.textTertiary }}>
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>

          {/* Score breakdown */}
          <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Aufschlüsselung</div>
            <div className="space-y-3">
              {[
                { label: '⏱ Fasten',    val: score.fasting,   max: 25 },
                { label: '🍽 Ernährung', val: score.nutrition, max: 25 },
                { label: '💧 Wasser',   val: score.hydration, max: 15 },
                { label: '👟 Aktivität', val: score.activity,  max: 20 },
                { label: '😴 Schlaf',   val: score.sleep,     max: 10 },
                { label: '💊 Medis',    val: score.meds,      max: 5  },
              ].map(({ label, val, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span className="font-mono" style={{ color: C.textSecondary }}>{val}/{max}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: C.bgTertiary }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(val / max) * 100}%`, background: val === max ? C.success : val > max * 0.5 ? C.info : C.warning }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Tips */}
          <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Dein Assistent</div>
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: C.bgTertiary }}>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── SLEEP TAB ─── */}
      {tab === 'sleep' && (
        <div className="space-y-4">
          {/* Today's sleep */}
          {todaySleep ? (
            <div className="rounded-2xl p-5 border text-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Letzte Nacht</div>
              <div className="text-5xl font-mono font-bold mb-1" style={{ color: todaySleep.durationH >= 7 ? C.success : C.warning }}>
                {todaySleep.durationH}h
              </div>
              <div className="text-sm mb-3" style={{ color: C.textTertiary }}>
                {todaySleep.bedtime} → {todaySleep.wakeTime} · {QUALITY_LABELS[todaySleep.quality]}
              </div>
              <div className="text-xs px-3 py-2 rounded-xl inline-block" style={{
                background: todaySleep.durationH >= 7 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                color: todaySleep.durationH >= 7 ? C.success : C.warning,
              }}>
                {todaySleep.durationH >= 8 ? '😄 Perfekt! 7-9h empfohlen' :
                 todaySleep.durationH >= 7 ? '😊 Gut geschlafen' :
                 todaySleep.durationH >= 6 ? '😐 Etwas knapp — früher schlafen gehen' :
                 '😔 Zu wenig Schlaf — Erholung priorisieren'}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 border text-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
              <div className="text-4xl mb-2">😴</div>
              <div className="font-medium mb-1">Noch kein Schlaf eingetragen</div>
              <div className="text-sm" style={{ color: C.textTertiary }}>Wie lange hast du letzte Nacht geschlafen?</div>
            </div>
          )}

          {/* Add sleep */}
          {!showAddSleep ? (
            <button onClick={() => setShowAddSleep(true)}
              className="w-full py-3 rounded-2xl font-semibold border"
              style={{ borderColor: C.info, color: C.info }}>
              + Schlaf eintragen
            </button>
          ) : (
            <div className="rounded-2xl p-4 border space-y-4" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
              <div className="text-xs uppercase tracking-widest" style={{ color: C.textTertiary }}>Schlaf eintragen</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: C.textSecondary }}>Eingeschlafen</label>
                  <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: C.textSecondary }}>Aufgewacht</label>
                  <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
                </div>
              </div>

              <div className="text-center p-2 rounded-xl" style={{ background: C.bgTertiary }}>
                <span className="font-mono font-bold text-xl" style={{ color: C.info }}>
                  {calcSleepDuration(bedtime, wakeTime)}h
                </span>
                <span className="text-sm ml-2" style={{ color: C.textTertiary }}>Schlaf</span>
              </div>

              <div>
                <label className="text-xs block mb-2" style={{ color: C.textSecondary }}>Schlafqualität</label>
                <div className="flex gap-2">
                  {([1,2,3,4,5] as const).map(q => (
                    <button key={q} onClick={() => setQuality(q)}
                      className="flex-1 py-2 rounded-xl text-sm border"
                      style={{
                        background: quality === q ? C.info : 'transparent',
                        borderColor: quality === q ? C.info : C.borderMedium,
                        color: quality === q ? '#fff' : C.textSecondary,
                      }}>
                      {q}
                    </button>
                  ))}
                </div>
                <div className="text-center text-xs mt-1" style={{ color: C.textTertiary }}>
                  {QUALITY_LABELS[quality]}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowAddSleep(false)}
                  className="flex-1 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
                  Abbrechen
                </button>
                <button onClick={handleAddSleep}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm"
                  style={{ background: C.success }}>
                  ✓ Speichern
                </button>
              </div>
            </div>
          )}

          {/* Sleep history */}
          {sleepEntries.length > 1 && (
            <div className="rounded-2xl p-4 border space-y-2" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Verlauf</div>
              {[...sleepEntries].reverse().slice(0, 7).map(e => (
                <div key={e.id} className="flex justify-between items-center py-2 border-b last:border-0"
                  style={{ borderColor: C.borderLight }}>
                  <div>
                    <div className="text-sm">{new Date(e.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    <div className="text-xs" style={{ color: C.textTertiary }}>{e.bedtime} → {e.wakeTime}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold" style={{ color: e.durationH >= 7 ? C.success : C.warning }}>
                      {e.durationH}h
                    </div>
                    <div className="text-xs" style={{ color: C.textTertiary }}>{QUALITY_LABELS[e.quality]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MEDS TAB ─── */}
      {tab === 'meds' && (
        <div className="space-y-4">
          {/* Today's meds */}
          {meds.filter(m => m.active).length > 0 && (
            <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
              <div className="flex justify-between items-center mb-3">
                <div className="text-xs uppercase tracking-widest" style={{ color: C.textTertiary }}>Heute</div>
                <span className="text-xs font-mono" style={{ color: medsTaken === medsTotal ? C.success : C.warning }}>
                  {medsTaken}/{medsTotal} genommen
                </span>
              </div>
              <div className="space-y-2">
                {meds.filter(m => m.active).map(med => {
                  const taken = isTaken(med.id, t)
                  return (
                    <button key={med.id} onClick={() => toggleTaken(med.id, t)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all"
                      style={{
                        background: taken ? 'rgba(16,185,129,0.08)' : C.bgTertiary,
                        borderColor: taken ? C.success : C.borderLight,
                      }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: med.color }} />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{med.name}</div>
                        <div className="text-xs" style={{ color: C.textTertiary }}>
                          {med.dose && `${med.dose} · `}{med.time}
                        </div>
                      </div>
                      <div className="text-lg">{taken ? '✅' : '⬜'}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {meds.length === 0 && !showAddMed && (
            <div className="rounded-2xl p-5 border text-center" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
              <div className="text-4xl mb-2">💊</div>
              <div className="font-medium mb-1">Keine Medikamente</div>
              <div className="text-sm" style={{ color: C.textTertiary }}>Vitamin D, Magnesium, Omega-3...</div>
            </div>
          )}

          {/* Add med form */}
          {!showAddMed ? (
            <button onClick={() => setShowAddMed(true)}
              className="w-full py-3 rounded-2xl font-semibold border"
              style={{ borderColor: C.info, color: C.info }}>
              + Medikament hinzufügen
            </button>
          ) : (
            <div className="rounded-2xl p-4 border space-y-3" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
              <div className="text-xs uppercase tracking-widest" style={{ color: C.textTertiary }}>Neues Medikament</div>

              <input type="text" value={medName} onChange={e => setMedName(e.target.value)}
                placeholder="Name (z.B. Vitamin D, Magnesium...)" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={medDose} onChange={e => setMedDose(e.target.value)}
                  placeholder="Dosis (z.B. 1000mg)" />
                <input type="time" value={medTime} onChange={e => setMedTime(e.target.value)} />
              </div>

              <div>
                <label className="text-xs block mb-2" style={{ color: C.textSecondary }}>Farbe</label>
                <div className="flex gap-2">
                  {MED_COLORS.map((c, i) => (
                    <button key={c} onClick={() => setMedColorIdx(i)}
                      className="w-8 h-8 rounded-full flex-shrink-0 transition-all"
                      style={{
                        background: c,
                        outline: medColorIdx === i ? `3px solid ${c}` : 'none',
                        outlineOffset: 2,
                        opacity: medColorIdx === i ? 1 : 0.5,
                      }} />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowAddMed(false)}
                  className="flex-1 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
                  Abbrechen
                </button>
                <button onClick={handleAddMed}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm"
                  style={{ background: medName ? C.success : C.bgTertiary }}>
                  ✓ Hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* Med list management */}
          {meds.length > 0 && (
            <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Alle Medikamente</div>
              {meds.map(med => (
                <div key={med.id} className="flex items-center gap-3 py-2 border-b last:border-0"
                  style={{ borderColor: C.borderLight }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: med.color }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{med.name}</div>
                    <div className="text-xs" style={{ color: C.textTertiary }}>{med.dose} · {med.time}</div>
                  </div>
                  <button onClick={() => removeMed(med.id)}
                    className="text-lg" style={{ color: C.textTertiary }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
