import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { useFastingTimer } from '../../hooks/useFastingTimer'
import { C } from '../../theme/colors'
import { calcBMR, calcTDEE, calcCalorieGoal, calcProteinGoal, calcDaysToGoal } from '../../utils/calculations'

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.bgTertiary }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { water_ml, addWater, todayCalories, todayProtein, weightEntries } = useAppStore()
  const {
    fastingActive, elapsed, remaining, progress,
    isComplete, elapsedFormatted, remainingFormatted, toggleFasting
  } = useFastingTimer()

  const w = user?.current_weight || 90
  const h = user?.height_cm || 175
  const a = user?.age || 45
  const act = user?.activity_level || 'moderate'

  const bmr = calcBMR(w, h, a)
  const tdee = calcTDEE(bmr, act)
  const calorieGoal = calcCalorieGoal(tdee)
  const proteinGoal = calcProteinGoal(w)
  const waterGoal = user?.water_goal || 2500

  const calories = todayCalories()
  const protein = todayProtein()

  const lastWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : w
  const daysToGoal = calcDaysToGoal(lastWeight, user?.target_weight || 85)

  return (
    <div className="space-y-4">
      {/* Fasting Timer Card */}
      <div className="rounded-2xl p-5 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-center mb-4">
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.textTertiary }}>
            {fastingActive ? (isComplete ? '✓ Ziel erreicht' : 'Fasten aktiv') : 'Fasten pausiert'}
          </div>
          <div
            className="text-5xl font-mono font-bold tracking-tight"
            style={{ color: isComplete ? C.success : fastingActive ? C.textPrimary : C.textTertiary }}
          >
            {fastingActive ? elapsedFormatted : '00:00:00'}
          </div>
          {fastingActive && !isComplete && (
            <div className="text-sm mt-1" style={{ color: C.textTertiary }}>
              Noch {remainingFormatted} bis 20h
            </div>
          )}
        </div>

        {/* Progress ring (simple bar) */}
        <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: C.bgTertiary }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress}%`, background: isComplete ? C.success : C.info }}
          />
        </div>

        <button
          onClick={toggleFasting}
          className="w-full py-3 rounded-xl font-semibold text-white"
          style={{ background: fastingActive ? C.danger : C.success }}
        >
          {fastingActive ? '⏹ Fasten beenden' : '▶ Fasten starten'}
        </button>
      </div>

      {/* Macros */}
      <div className="rounded-2xl p-4 border space-y-4" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest" style={{ color: C.textTertiary }}>Heute</div>

        {/* Calories */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Kalorien</span>
            <span className="font-mono text-sm" style={{ color: C.textSecondary }}>
              {calories} / {calorieGoal} kcal
            </span>
          </div>
          <ProgressBar value={calories} max={calorieGoal} color={calories > calorieGoal ? C.danger : C.success} />
        </div>

        {/* Protein */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Protein</span>
            <span className="font-mono text-sm" style={{ color: C.textSecondary }}>
              {protein} / {proteinGoal} g
            </span>
          </div>
          <ProgressBar value={protein} max={proteinGoal} color={C.info} />
        </div>

        {/* Water */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Wasser</span>
            <span className="font-mono text-sm" style={{ color: C.textSecondary }}>
              {(water_ml / 1000).toFixed(1)} / {(waterGoal / 1000).toFixed(1)} L
            </span>
          </div>
          <ProgressBar value={water_ml} max={waterGoal} color="#38BDF8" />
          <div className="flex gap-2 mt-2">
            {[250, 500].map(ml => (
              <button
                key={ml}
                onClick={() => addWater(ml)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
                style={{ borderColor: C.borderMedium, color: C.textSecondary }}
              >
                +{ml}ml
              </button>
            ))}
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
          {daysToGoal > 0 && (
            <div className="text-xs mt-1" style={{ color: C.success }}>~{daysToGoal} Tage</div>
          )}
          {daysToGoal === 0 && (
            <div className="text-xs mt-1" style={{ color: C.success }}>✓ Ziel erreicht!</div>
          )}
        </div>
      </div>

      {/* TDEE Info */}
      <div className="rounded-2xl p-4 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Dein Kalorienbedarf</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-mono font-bold text-lg">{bmr}</div>
            <div className="text-xs" style={{ color: C.textTertiary }}>BMR</div>
          </div>
          <div>
            <div className="font-mono font-bold text-lg">{tdee}</div>
            <div className="text-xs" style={{ color: C.textTertiary }}>TDEE</div>
          </div>
          <div>
            <div className="font-mono font-bold text-lg" style={{ color: C.success }}>{calorieGoal}</div>
            <div className="text-xs" style={{ color: C.textTertiary }}>Ziel</div>
          </div>
        </div>
      </div>
    </div>
  )
}
