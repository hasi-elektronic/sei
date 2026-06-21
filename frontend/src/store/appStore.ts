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

interface AppStore {
  meals: Meal[]
  weightEntries: WeightEntry[]
  water_ml: number
  fastingActive: boolean
  fastingStart: string | null

  addMeal: (meal: Omit<Meal, 'id'>) => void
  removeMeal: (id: string) => void
  addWeight: (weight: number) => void
  setWater: (ml: number) => void
  addWater: (ml: number) => void
  toggleFasting: () => void

  todayCalories: () => number
  todayProtein: () => number
}

const today = () => new Date().toISOString().split('T')[0]

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
  catch { return fallback }
}

export const useAppStore = create<AppStore>((set, get) => ({
  meals: loadFromStorage('sei-meals', []),
  weightEntries: loadFromStorage('sei-weights', []),
  water_ml: loadFromStorage('sei-water', 0),
  fastingActive: loadFromStorage('sei-fasting-active', false),
  fastingStart: loadFromStorage('sei-fasting-start', null),

  addMeal: (meal) => {
    const entry = { ...meal, id: crypto.randomUUID() }
    const meals = [...get().meals, entry]
    localStorage.setItem('sei-meals', JSON.stringify(meals))
    set({ meals })
  },

  removeMeal: (id) => {
    const meals = get().meals.filter(m => m.id !== id)
    localStorage.setItem('sei-meals', JSON.stringify(meals))
    set({ meals })
  },

  addWeight: (weight) => {
    const entry: WeightEntry = { id: crypto.randomUUID(), date: today(), weight }
    const entries = [...get().weightEntries, entry]
    localStorage.setItem('sei-weights', JSON.stringify(entries))
    set({ weightEntries: entries })
  },

  setWater: (ml) => {
    localStorage.setItem('sei-water', JSON.stringify(ml))
    set({ water_ml: ml })
  },

  addWater: (ml) => {
    const newVal = get().water_ml + ml
    localStorage.setItem('sei-water', JSON.stringify(newVal))
    set({ water_ml: newVal })
  },

  toggleFasting: () => {
    const active = !get().fastingActive
    const start = active ? new Date().toISOString() : null
    localStorage.setItem('sei-fasting-active', JSON.stringify(active))
    localStorage.setItem('sei-fasting-start', JSON.stringify(start))
    set({ fastingActive: active, fastingStart: start })
  },

  todayCalories: () => {
    const t = today()
    return get().meals.filter(m => m.date === t).reduce((s, m) => s + m.calories, 0)
  },

  todayProtein: () => {
    const t = today()
    return get().meals.filter(m => m.date === t).reduce((s, m) => s + m.protein, 0)
  },
}))
