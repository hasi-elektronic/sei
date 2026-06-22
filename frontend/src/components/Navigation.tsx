import { C } from '../theme/colors'

type Page = 'dashboard' | 'chat' | 'weight' | 'settings'

const NAV = [
  { id: 'dashboard', icon: '⏱', label: 'Fasten' },
  { id: 'chat',      icon: '💬', label: 'Essen' },
  { id: 'weight',    icon: '⚖',  label: 'Gewicht' },
  { id: 'settings',  icon: '⚙',  label: 'Profil' },
]

export default function Navigation({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-2 border-t"
      style={{ background: C.bgSecondary, borderColor: C.borderLight }}
    >
      {NAV.map(n => (
        <button
          key={n.id}
          onClick={() => setPage(n.id as Page)}
          className="flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl"
          style={{ opacity: page === n.id ? 1 : 0.4 }}
        >
          <span className="text-xl leading-none">{n.icon}</span>
          <span className="text-xs" style={{ color: page === n.id ? C.textPrimary : C.textTertiary }}>
            {n.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
