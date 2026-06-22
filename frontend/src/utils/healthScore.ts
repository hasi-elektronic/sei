import type { SleepEntry } from '../store/sleepStore'

interface ScoreInput {
  calories: number
  calorieGoal: number
  protein: number
  proteinGoal: number
  waterMl: number
  waterGoal: number
  fastingElapsed: number  // seconds
  steps: number
  stepGoal: number
  sleep?: SleepEntry
  medsTaken: number
  medsTotal: number
}

export interface ScoreBreakdown {
  total: number
  fasting: number
  nutrition: number
  hydration: number
  activity: number
  sleep: number
  meds: number
}

export function calcHealthScore(input: ScoreInput): ScoreBreakdown {
  const FAST_GOAL = 20 * 3600

  // Fasting (25 pts)
  const fastPct = Math.min(1, input.fastingElapsed / FAST_GOAL)
  const fasting = Math.round(fastPct * 25)

  // Nutrition (25 pts): kalori + protein
  const kcalDiff = Math.abs(input.calories - input.calorieGoal) / input.calorieGoal
  const kcalScore = Math.max(0, 1 - kcalDiff * 2)
  const protPct = Math.min(1, input.protein / input.proteinGoal)
  const nutrition = Math.round((kcalScore * 0.5 + protPct * 0.5) * 25)

  // Hydration (15 pts)
  const hydration = Math.round(Math.min(1, input.waterMl / input.waterGoal) * 15)

  // Activity / steps (20 pts)
  const activity = Math.round(Math.min(1, input.steps / input.stepGoal) * 20)

  // Sleep (10 pts)
  let sleep = 0
  if (input.sleep) {
    const h = input.sleep.durationH
    const qualScore = input.sleep.quality / 5
    const durScore = h >= 7 && h <= 9 ? 1 : h >= 6 ? 0.7 : h >= 5 ? 0.4 : 0.2
    sleep = Math.round((durScore * 0.6 + qualScore * 0.4) * 10)
  }

  // Meds (5 pts)
  const meds = input.medsTotal > 0
    ? Math.round((input.medsTaken / input.medsTotal) * 5)
    : 5 // no meds = full points

  const total = Math.min(100, fasting + nutrition + hydration + activity + sleep + meds)

  return { total, fasting, nutrition, hydration, activity, sleep, meds }
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#10B981'  // green
  if (score >= 60) return '#3B82F6'  // blue
  if (score >= 40) return '#F59E0B'  // amber
  return '#EF4444'                    // red
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Ausgezeichnet'
  if (score >= 60) return 'Gut'
  if (score >= 40) return 'Okay'
  return 'Verbesserungsbedarf'
}
