type Page = 'dashboard' | 'chat' | 'steps' | 'weight' | 'settings'

const NAV = [
  { id: 'dashboard', icon: '⏱', label: 'Fasten' },
  { id: 'chat',      icon: '💬', label: 'Essen' },
  { id: 'steps',     icon: '👟', label: 'Schritte' },
  { id: 'weight',    icon: '⚖',  label: 'Gewicht' },
  { id: 'settings',  icon: '⚙',  label: 'Profil' },
]

export default function Navigation({ page, setPage, theme }: {
  page: Page
  setPage: (p: Page) => void
  theme: 'dark' | 'light'
}) {
  const bg = theme === 'dark' ? '#1E293B' : '#FFFFFF'
  const border = theme === 'dark' ? '#334155' : '#E2E8F0'
  const activeColor = '#3B82F6'
  const inactiveColor = theme === 'dark' ? '#475569' : '#94A3B8'

  return (
    <nav className="flex justify-center border-b" style={{ background: bg, borderColor: border }}>
      {NAV.map(n => {
        const active = page === n.id
        return (
          <button key={n.id} onClick={() => setPage(n.id as Page)}
            className="flex flex-col items-center gap-0.5 py-2 px-4"
            style={{
              borderBottom: active ? `2px solid ${activeColor}` : '2px solid transparent',
              color: active ? activeColor : inactiveColor,
            }}>
            <span className="text-base leading-none">{n.icon}</span>
            <span className="text-xs font-medium" style={{ fontSize: '10px' }}>{n.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
