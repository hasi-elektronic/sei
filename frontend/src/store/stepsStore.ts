import { create } from 'zustand'

export interface StepDay {
  date: string
  steps: number
  calories: number
  km: number
}

interface StepsStore {
  stepDays: StepDay[]
  todaySteps: number
  stepGoal: number
  isTracking: boolean
  addSteps: (steps: number) => void
  setSteps: (steps: number) => void
  setGoal: (goal: number) => void
  saveTodaySteps: () => void
  startTracking: () => void
  stopTracking: () => void
}

const today = () => new Date().toISOString().split('T')[0]

const load = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
  catch { return fallback }
}
const save = (key: string, val: unknown) => localStorage.setItem(key, JSON.stringify(val))

// 1 step ≈ 0.762m, 1000 steps ≈ 40 kcal (70kg person)
const stepsToKm = (s: number) => +(s * 0.000762).toFixed(2)
const stepsToKcal = (s: number) => Math.round(s * 0.04)

export const useStepsStore = create<StepsStore>((set, get) => ({
  stepDays: load('sei-stepdays', []),
  todaySteps: load('sei-today-steps', 0),
  stepGoal: load('sei-step-goal', 8000),
  isTracking: false,

  addSteps: (n) => {
    const s = get().todaySteps + n
    save('sei-today-steps', s)
    set({ todaySteps: s })
  },

  setSteps: (n) => {
    save('sei-today-steps', n)
    set({ todaySteps: n })
  },

  setGoal: (g) => {
    save('sei-step-goal', g)
    set({ stepGoal: g })
  },

  saveTodaySteps: () => {
    const t = today()
    const s = get().todaySteps
    const entry: StepDay = {
      date: t,
      steps: s,
      calories: stepsToKcal(s),
      km: stepsToKm(s),
    }
    const days = [...get().stepDays.filter(d => d.date !== t), entry]
    save('sei-stepdays', days)
    set({ stepDays: days })
  },

  startTracking: () => set({ isTracking: true }),
  stopTracking: () => set({ isTracking: false }),
}))

export { stepsToKcal, stepsToKm }
