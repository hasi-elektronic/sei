import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { C } from '../../theme/colors'

export default function Login({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try { await login(email, password) }
    catch {}
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bgPrimary }}>
      <div className="w-full max-w-sm rounded-2xl p-6 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-center mb-8">
          <div className="text-4xl mb-1" style={{ fontFamily: '"IBM Plex Serif", serif' }}>清</div>
          <div className="text-2xl font-semibold" style={{ fontFamily: '"IBM Plex Serif", serif' }}>SEI</div>
          <div className="text-sm mt-1" style={{ color: C.textSecondary }}>Klar. Rein. Bewusst.</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm block mb-1" style={{ color: C.textSecondary }}>E-Mail</label>
            <input type="email" value={email} onChange={e => { clearError(); setEmail(e.target.value) }} placeholder="dein@email.de" required />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: C.textSecondary }}>Passwort</label>
            <input type="password" value={password} onChange={e => { clearError(); setPassword(e.target.value) }} placeholder="••••••••" required />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: C.danger }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-medium text-white mt-2"
            style={{ background: submitting ? C.bgTertiary : C.info }}
          >
            {submitting ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center text-sm mt-4" style={{ color: C.textSecondary }}>
          Noch kein Konto?{' '}
          <button onClick={onSwitch} style={{ color: C.info }} className="underline">
            Registrieren
          </button>
        </p>
      </div>
    </div>
  )
}
