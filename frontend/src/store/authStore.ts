import { create } from 'zustand'

export interface User {
  id: string
  name: string
  email: string
  age?: number
  height_cm?: number
  current_weight?: number
  target_weight?: number
  activity_level?: string
  protein_goal?: number
  water_goal?: number
}

interface AuthStore {
  token: string | null
  user: User | null
  isLoading: boolean
  error: string | null
  onboardDone: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (u: Partial<User>) => void
  setOnboardDone: () => void
  clearError: () => void
}

const API = import.meta.env.VITE_API_URL || 'https://sei-api.hguencavdi.workers.dev'

const getStoredUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem('sei-user') || 'null') } catch { return null }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: localStorage.getItem('sei-token'),
  user: getStoredUser(),
  isLoading: false,
  error: null,
  onboardDone: localStorage.getItem('sei-onboard') === 'true',

  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registrierung fehlgeschlagen')
      localStorage.setItem('sei-token', data.token)
      localStorage.setItem('sei-user', JSON.stringify(data.user))
      set({ token: data.token, user: data.user, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Fehler', isLoading: false })
      throw e
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Anmeldung fehlgeschlagen')
      localStorage.setItem('sei-token', data.token)
      localStorage.setItem('sei-user', JSON.stringify(data.user))
      set({ token: data.token, user: data.user, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Fehler', isLoading: false })
      throw e
    }
  },

  logout: () => {
    localStorage.removeItem('sei-token')
    localStorage.removeItem('sei-user')
    localStorage.removeItem('sei-onboard')
    set({ token: null, user: null, onboardDone: false })
  },

  setUser: (partial) => {
    const current = get().user
    if (!current) return
    const updated = { ...current, ...partial }
    localStorage.setItem('sei-user', JSON.stringify(updated))
    set({ user: updated })
  },

  setOnboardDone: () => {
    localStorage.setItem('sei-onboard', 'true')
    set({ onboardDone: true })
  },

  clearError: () => set({ error: null }),
}))
