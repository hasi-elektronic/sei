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
      className="flex justify-center border-b"
      style={{ background: C.bgSecondary, borderColor: C.borderLight }}
    >
      {NAV.map(n => {
        const active = page === n.id
        return (
          <button
            key={n.id}
            onClick={() => setPage(n.id as Page)}
            className="flex flex-col items-center gap-0.5 py-2 px-5"
            style={{
              borderBottom: active ? `2px solid ${C.info}` : '2px solid transparent',
              color: active ? C.info : C.textTertiary,
            }}
          >
            <span className="text-lg leading-none">{n.icon}</span>
            <span className="text-xs font-medium">{n.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
