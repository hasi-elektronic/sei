import { useState } from 'react'
import { useAuthStore } from './store/authStore'
import { useAppStore } from './store/appStore'
import Landing from './components/Landing'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Onboard from './components/Auth/Onboard'
import Dashboard from './components/Dashboard/Dashboard'
import FoodChat from './components/Chat/FoodChat'
import Steps from './components/Steps/Steps'
import Weight from './components/Weight/Weight'
import HealthAssistant from './components/Assistant/HealthAssistant'
import Settings from './components/Settings/Settings'
import Navigation from './components/Navigation'

type Page = 'dashboard' | 'assistant' | 'chat' | 'steps' | 'weight' | 'settings'
type AuthPage = 'landing' | 'login' | 'register'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [authPage, setAuthPage] = useState<AuthPage>('landing')
  const { token, onboardDone } = useAuthStore()
  const { theme } = useAppStore()

  const bg = theme === 'dark' ? '#0F172A' : '#F8FAFC'
  const text = theme === 'dark' ? '#F1F5F9' : '#0F172A'
  const headerBorder = theme === 'dark' ? '#334155' : '#E2E8F0'
  const headerBg = theme === 'dark' ? '#0F172A' : '#FFFFFF'

  if (!token) {
    return (
      <div style={{ background: bg, minHeight: '100vh', color: text }}>
        {authPage === 'landing' && <Landing onLogin={() => setAuthPage('login')} onRegister={() => setAuthPage('register')} />}
        {authPage === 'login' && <Login onSwitch={() => setAuthPage('register')} />}
        {authPage === 'register' && <Register onSwitch={() => setAuthPage('login')} />}
      </div>
    )
  }

  if (!onboardDone) {
    return <div style={{ background: bg, minHeight: '100vh', color: text }}><Onboard onComplete={() => {}} /></div>
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', color: text, display: 'flex', flexDirection: 'column' }}>
      <header className="flex items-center justify-between px-4 py-3 border-b"
        style={{ background: headerBg, borderColor: headerBorder }}>
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ fontFamily: '"IBM Plex Serif", serif' }}>清</span>
          <span className="text-xl font-semibold" style={{ fontFamily: '"IBM Plex Serif", serif' }}>SEI</span>
        </div>
        <span className="text-xs" style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>
          {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </header>

      <Navigation page={page} setPage={setPage} theme={theme} />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 pb-6 overflow-y-auto">
        {page === 'dashboard'  && <Dashboard />}
        {page === 'assistant'  && <HealthAssistant />}
        {page === 'chat'       && <FoodChat />}
        {page === 'steps'      && <Steps />}
        {page === 'weight'     && <Weight />}
        {page === 'settings'   && <Settings />}
      </main>
    </div>
  )
}
