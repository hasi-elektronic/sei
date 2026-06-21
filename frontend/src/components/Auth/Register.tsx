import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { C } from '../../theme/colors'

export default function Register({ onSwitch }: { onSwitch: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [validErr, setValidErr] = useState('')
  const { register, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setValidErr('Passwörter stimmen nicht überein'); return }
    if (password.length < 8) { setValidErr('Passwort min. 8 Zeichen'); return }
    setValidErr('')
    setSubmitting(true)
    try { await register(name, email, password) }
    catch {}
    finally { setSubmitting(false) }
  }

  const shownError = validErr || error

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bgPrimary }}>
      <div className="w-full max-w-sm rounded-2xl p-6 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-center mb-6">
          <div className="text-4xl" style={{ fontFamily: '"IBM Plex Serif", serif' }}>清</div>
          <div className="text-2xl font-semibold mt-1" style={{ fontFamily: '"IBM Plex Serif", serif' }}>Registrieren</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm block mb-1" style={{ color: C.textSecondary }}>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Hamdi" required />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: C.textSecondary }}>E-Mail</label>
            <input type="email" value={email} onChange={e => { clearError(); setEmail(e.target.value) }} placeholder="dein@email.de" required />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: C.textSecondary }}>Passwort</label>
            <input type="password" value={password} onChange={e => { clearError(); setValidErr(''); setPassword(e.target.value) }} placeholder="min. 8 Zeichen" required />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: C.textSecondary }}>Passwort wiederholen</label>
            <input type="password" value={confirm} onChange={e => { setValidErr(''); setConfirm(e.target.value) }} placeholder="••••••••" required />
          </div>

          {shownError && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: C.danger }}>
              {shownError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-medium text-white mt-2"
            style={{ background: submitting ? C.bgTertiary : C.success }}
          >
            {submitting ? 'Wird registriert...' : 'Konto erstellen'}
          </button>
        </form>

        <p className="text-center text-sm mt-4" style={{ color: C.textSecondary }}>
          Schon registriert?{' '}
          <button onClick={onSwitch} style={{ color: C.info }} className="underline">
            Anmelden
          </button>
        </p>
      </div>
    </div>
  )
}
