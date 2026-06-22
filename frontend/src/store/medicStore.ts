import { create } from 'zustand'

export interface Medication {
  id: string
  name: string
  dose: string
  time: string   // "08:00"
  color: string
  active: boolean
}

export interface MedLog {
  date: string
  medId: string
  taken: boolean
}

interface MedicStore {
  meds: Medication[]
  logs: MedLog[]
  addMed: (m: Omit<Medication, 'id'>) => void
  removeMed: (id: string) => void
  toggleTaken: (medId: string, date: string) => void
  isTaken: (medId: string, date: string) => boolean
}

const load = <T>(k: string, f: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? f } catch { return f } }
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))

export const useMedicStore = create<MedicStore>((set, get) => ({
  meds: load('sei-meds', []),
  logs: load('sei-medlogs', []),

  addMed: (m) => {
    const med = { ...m, id: crypto.randomUUID() }
    const meds = [...get().meds, med]
    save('sei-meds', meds)
    set({ meds })
  },

  removeMed: (id) => {
    const meds = get().meds.filter(m => m.id !== id)
    save('sei-meds', meds)
    set({ meds })
  },

  toggleTaken: (medId, date) => {
    const logs = get().logs.filter(l => !(l.medId === medId && l.date === date))
    const wasTaken = get().isTaken(medId, date)
    if (!wasTaken) logs.push({ date, medId, taken: true })
    save('sei-medlogs', logs)
    set({ logs })
  },

  isTaken: (medId, date) => get().logs.some(l => l.medId === medId && l.date === date && l.taken),
}))
