import { create } from 'zustand'

export interface SleepEntry {
  id: string
  date: string
  bedtime: string    // "22:30"
  wakeTime: string   // "06:30"
  durationH: number  // 8.0
  quality: 1 | 2 | 3 | 4 | 5
}

interface SleepStore {
  entries: SleepEntry[]
  addEntry: (e: Omit<SleepEntry, 'id'>) => void
  removeEntry: (id: string) => void
  todayEntry: () => SleepEntry | undefined
}

const load = <T>(k: string, f: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? f } catch { return f } }
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))
const today = () => new Date().toISOString().split('T')[0]

export const useSleepStore = create<SleepStore>((set, get) => ({
  entries: load('sei-sleep', []),

  addEntry: (e) => {
    const entry = { ...e, id: crypto.randomUUID() }
    const entries = [...get().entries.filter(x => x.date !== e.date), entry]
    save('sei-sleep', entries)
    set({ entries })
  },

  removeEntry: (id) => {
    const entries = get().entries.filter(e => e.id !== id)
    save('sei-sleep', entries)
    set({ entries })
  },

  todayEntry: () => get().entries.find(e => e.date === today()),
}))
