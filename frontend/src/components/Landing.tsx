import { C } from '../theme/colors'

export default function Landing({ onLogin, onRegister }: {
  onLogin: () => void
  onRegister: () => void
}) {
  return (
    <div style={{ background: C.bgPrimary, minHeight: '100vh', color: C.textPrimary }}>
      
      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{ fontFamily: '"IBM Plex Serif", serif' }}>清</span>
          <span className="text-xl font-semibold tracking-wide" style={{ fontFamily: '"IBM Plex Serif", serif' }}>SEI</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onLogin}
            className="px-4 py-2 rounded-xl text-sm font-medium border"
            style={{ borderColor: C.borderMedium, color: C.textSecondary }}
          >
            Anmelden
          </button>
          <button
            onClick={onRegister}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: C.success }}
          >
            Kostenlos starten
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-12 max-w-2xl mx-auto">
        <div className="text-7xl mb-4" style={{ fontFamily: '"IBM Plex Serif", serif', color: C.success }}>
          清
        </div>
        <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: '"IBM Plex Serif", serif' }}>
          Fasten. Einfach.<br />Bewusst.
        </h1>
        <p className="text-lg mb-8 leading-relaxed" style={{ color: C.textSecondary }}>
          SEI ist dein minimalistischer Begleiter für Intervallfasten —
          Timer, Kalorien, Protein, Gewicht. Alles in einer App.
        </p>
        <button
          onClick={onRegister}
          className="px-8 py-4 rounded-2xl text-lg font-semibold text-white"
          style={{ background: C.success }}
        >
          Jetzt kostenlos starten
        </button>
        <p className="text-xs mt-3" style={{ color: C.textTertiary }}>
          Kein Abo. Keine Werbung. Kein Tracking.
        </p>
      </section>

      {/* Feature Cards */}
      <section className="max-w-2xl mx-auto px-6 pb-12 grid grid-cols-2 gap-4">
        {[
          { icon: '⏱', title: '20:4 Timer', desc: 'Starte deinen Fastentimer mit einem Klick. Sieh genau, wie lange du fastest.' },
          { icon: '🍽', title: 'Mahlzeiten', desc: '25+ Lebensmittel. Gramm eingeben → Kalorien & Protein automatisch berechnet.' },
          { icon: '⚖', title: 'Gewicht', desc: 'Tägliche Einträge, Verlaufsgraph, Tage bis zum Zielgewicht.' },
          { icon: '📊', title: 'BMR & TDEE', desc: 'Dein persönlicher Kalorienbedarf — berechnet nach Mifflin-St Jeor.' },
        ].map(f => (
          <div
            key={f.title}
            className="rounded-2xl p-4 border"
            style={{ background: C.bgSecondary, borderColor: C.borderLight }}
          >
            <div className="text-3xl mb-2">{f.icon}</div>
            <div className="font-semibold text-sm mb-1">{f.title}</div>
            <div className="text-xs leading-relaxed" style={{ color: C.textSecondary }}>{f.desc}</div>
          </div>
        ))}
      </section>

      {/* 20:4 Visual */}
      <section
        className="mx-6 max-w-2xl mx-auto rounded-2xl p-6 border mb-8"
        style={{ background: C.bgSecondary, borderColor: C.borderLight }}
      >
        <div className="text-xs uppercase tracking-widest mb-4 text-center" style={{ color: C.textTertiary }}>
          Wie 20:4 Intervallfasten funktioniert
        </div>
        <div className="flex rounded-xl overflow-hidden h-10 mb-3">
          <div
            className="flex items-center justify-center text-xs font-semibold text-white"
            style={{ width: '83%', background: C.info }}
          >
            20h Fasten
          </div>
          <div
            className="flex items-center justify-center text-xs font-semibold"
            style={{ width: '17%', background: C.success, color: '#fff' }}
          >
            4h Essen
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center mt-4">
          {[
            ['Fettstoffwechsel', 'Körper verbrennt Fettreserven'],
            ['Muskelerhalt', 'Hohe Proteinzufuhr schützt Muskeln'],
            ['Einfach', 'Kein Kalorienzählen den ganzen Tag'],
            ['Flexibel', 'Essensfenster frei wählbar'],
          ].map(([t, d]) => (
            <div key={t}>
              <div className="text-sm font-medium">{t}</div>
              <div className="text-xs mt-0.5" style={{ color: C.textTertiary }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="text-center px-6 pb-16">
        <p className="text-sm mb-4" style={{ color: C.textSecondary }}>
          Schon dabei? Melde dich an.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onLogin}
            className="px-6 py-3 rounded-xl font-medium border"
            style={{ borderColor: C.borderMedium, color: C.textSecondary }}
          >
            Anmelden
          </button>
          <button
            onClick={onRegister}
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: C.success }}
          >
            Registrieren →
          </button>
        </div>
        <p className="text-xs mt-6" style={{ color: C.textTertiary }}>
          清 SEI · Klar. Rein. Bewusst. · Made by Hasi Elektronic
        </p>
      </section>
    </div>
  )
}
