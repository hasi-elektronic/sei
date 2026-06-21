import { useState } from 'react'
import { useAuthStore } from './store/authStore'
import { C } from './theme/colors'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Onboard from './components/Auth/Onboard'
import Dashboard from './components/Dashboard/Dashboard'
import AddMeal from './components/Meals/AddMeal'
import Weight from './components/Weight/Weight'
import Settings from './components/Settings/Settings'
import Navigation from './components/Navigation'

type Page = 'dashboard' | 'meals' | 'weight' | 'settings'
type AuthPage = 'login' | 'register' | 'onboard'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [authPage, setAuthPage] = useState<AuthPage>('login')
  const { token, onboardDone } = useAuthStore()

  // Not logged in
  if (!token) {
    return (
      <div style={{ background: C.bgPrimary, minHeight: '100vh' }}>
        {authPage === 'login' && <Login onSwitch={() => setAuthPage('register')} />}
        {authPage === 'register' && <Register onSwitch={() => setAuthPage('login')} />}
      </div>
    )
  }

  // Logged in but no onboard
  if (!onboardDone) {
    return (
      <div style={{ background: C.bgPrimary, minHeight: '100vh' }}>
        <Onboard onComplete={() => {}} />
      </div>
    )
  }

  // Main App
  return (
    <div style={{ background: C.bgPrimary, minHeight: '100vh', color: C.textPrimary }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: C.bgPrimary, borderColor: C.borderLight }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ fontFamily: '"IBM Plex Serif", serif' }}>清</span>
          <span className="text-xl font-semibold tracking-wide" style={{ fontFamily: '"IBM Plex Serif", serif' }}>SEI</span>
        </div>
        <span className="text-xs" style={{ color: C.textTertiary }}>
          {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </header>

      {/* Page Content */}
      <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {page === 'dashboard' && <Dashboard />}
        {page === 'meals'     && <AddMeal />}
        {page === 'weight'    && <Weight />}
        {page === 'settings'  && <Settings />}
      </main>

      <Navigation page={page} setPage={setPage} />
    </div>
  )
}
