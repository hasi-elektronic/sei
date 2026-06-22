import { useState } from 'react'
import { useAuthStore } from './store/authStore'
import { C } from './theme/colors'
import Landing from './components/Landing'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Onboard from './components/Auth/Onboard'
import Dashboard from './components/Dashboard/Dashboard'
import FoodChat from './components/Chat/FoodChat'
import Weight from './components/Weight/Weight'
import Settings from './components/Settings/Settings'
import Navigation from './components/Navigation'

type Page = 'dashboard' | 'chat' | 'weight' | 'settings'
type AuthPage = 'landing' | 'login' | 'register'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [authPage, setAuthPage] = useState<AuthPage>('landing')
  const { token, onboardDone } = useAuthStore()

  if (!token) {
    return (
      <div style={{ background: C.bgPrimary, minHeight: '100vh' }}>
        {authPage === 'landing' && <Landing onLogin={() => setAuthPage('login')} onRegister={() => setAuthPage('register')} />}
        {authPage === 'login' && <Login onSwitch={() => setAuthPage('register')} />}
        {authPage === 'register' && <Register onSwitch={() => setAuthPage('login')} />}
      </div>
    )
  }

  if (!onboardDone) {
    return <div style={{ background: C.bgPrimary, minHeight: '100vh' }}><Onboard onComplete={() => {}} /></div>
  }

  return (
    <div style={{ background: C.bgPrimary, minHeight: '100vh', color: C.textPrimary, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ background: C.bgPrimary, borderColor: C.borderLight }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ fontFamily: '"IBM Plex Serif", serif' }}>清</span>
          <span className="text-xl font-semibold" style={{ fontFamily: '"IBM Plex Serif", serif' }}>SEI</span>
        </div>
        <span className="text-xs" style={{ color: C.textTertiary }}>
          {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </header>

      {/* TOP Navigation */}
      <Navigation page={page} setPage={setPage} />

      {/* Content */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 pb-6 overflow-y-auto">
        {page === 'dashboard' && <Dashboard />}
        {page === 'chat'      && <FoodChat />}
        {page === 'weight'    && <Weight />}
        {page === 'settings'  && <Settings />}
      </main>

    </div>
  )
}
