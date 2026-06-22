import { create } from 'zustand'

export interface Meal {
  id: string
  date: string
  time: string
  food_name: string
  grams: number
  calories: number
  protein: number
}

export interface WeightEntry {
  id: string
  date: string
  weight: number
}

export interface DayLog {
  date: string
  calories: number
  protein: number
  water_ml: number
  fastingDone: boolean
  fastingMinutes: number
}

interface AppStore {
  meals: Meal[]
  weightEntries: WeightEntry[]
  water_ml: number
  fastingActive: boolean
  fastingStart: string | null
  theme: 'dark' | 'light'
  dayLogs: DayLog[]

  addMeal: (meal: Omit<Meal, 'id'>) => void
  removeMeal: (id: string) => void
  addWeight: (weight: number) => void
  setWater: (ml: number) => void
  addWater: (ml: number) => void
  toggleFasting: () => void
  setTheme: (t: 'dark' | 'light') => void
  saveDayLog: () => void

  todayCalories: () => number
  todayProtein: () => number
  getStreak: () => number
}

const today = () => new Date().toISOString().split('T')[0]

const load = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
  catch { return fallback }
}
const save = (key: string, val: unknown) => localStorage.setItem(key, JSON.stringify(val))

export const useAppStore = create<AppStore>((set, get) => ({
  meals: load('sei-meals', []),
  weightEntries: load('sei-weights', []),
  water_ml: load('sei-water', 0),
  fastingActive: load('sei-fasting-active', false),
  fastingStart: load('sei-fasting-start', null),
  theme: load('sei-theme', 'dark'),
  dayLogs: load('sei-daylogs', []),

  addMeal: (meal) => {
    const m = { ...meal, id: crypto.randomUUID() }
    const meals = [...get().meals, m]
    save('sei-meals', meals)
    set({ meals })
  },

  removeMeal: (id) => {
    const meals = get().meals.filter(m => m.id !== id)
    save('sei-meals', meals)
    set({ meals })
  },

  addWeight: (weight) => {
    const entry: WeightEntry = { id: crypto.randomUUID(), date: today(), weight }
    const entries = [...get().weightEntries, entry]
    save('sei-weights', entries)
    set({ weightEntries: entries })
  },

  setWater: (ml) => { save('sei-water', ml); set({ water_ml: ml }) },
  addWater: (ml) => {
    const v = get().water_ml + ml
    save('sei-water', v)
    set({ water_ml: v })
  },

  toggleFasting: () => {
    const active = !get().fastingActive
    const start = active ? new Date().toISOString() : null
    if (!active) {
      // Save day log when fasting ends
      const elapsed = get().fastingStart
        ? Math.floor((Date.now() - new Date(get().fastingStart!).getTime()) / 60000)
        : 0
      const t = today()
      const logs = get().dayLogs.filter(l => l.date !== t)
      const newLog: DayLog = {
        date: t,
        calories: get().todayCalories(),
        protein: get().todayProtein(),
        water_ml: get().water_ml,
        fastingDone: elapsed >= 20 * 60,
        fastingMinutes: elapsed,
      }
      const updated = [...logs, newLog]
      save('sei-daylogs', updated)
      set({ dayLogs: updated })
    }
    save('sei-fasting-active', active)
    save('sei-fasting-start', start)
    set({ fastingActive: active, fastingStart: start })
  },

  setTheme: (t) => { save('sei-theme', t); set({ theme: t }) },

  saveDayLog: () => {
    const t = today()
    const logs = get().dayLogs.filter(l => l.date !== t)
    const newLog: DayLog = {
      date: t,
      calories: get().todayCalories(),
      protein: get().todayProtein(),
      water_ml: get().water_ml,
      fastingDone: false,
      fastingMinutes: 0,
    }
    const updated = [...logs, newLog]
    save('sei-daylogs', updated)
    set({ dayLogs: updated })
  },

  todayCalories: () => {
    const t = today()
    return get().meals.filter(m => m.date === t).reduce((s, m) => s + m.calories, 0)
  },

  todayProtein: () => {
    const t = today()
    return get().meals.filter(m => m.date === t).reduce((s, m) => s + m.protein, 0)
  },

  getStreak: () => {
    const logs = get().dayLogs
    if (!logs.length) return 0
    let streak = 0
    const d = new Date()
    // Check today first, then go back
    for (let i = 0; i < 365; i++) {
      const dateStr = new Date(d.getTime() - i * 86400000).toISOString().split('T')[0]
      const log = logs.find(l => l.date === dateStr)
      if (log && log.fastingDone) streak++
      else if (i > 0) break // gap → stop
    }
    return streak
  },
}))
