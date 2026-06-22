import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { C } from '../../theme/colors'

const API = import.meta.env.VITE_API_URL || 'https://sei-api.hguencavdi.workers.dev'

interface FoodItem { name: string; grams: number; calories: number; protein: number }
interface Message {
  id: string
  role: 'user' | 'bot'
  text: string
  items?: FoodItem[]
  added?: boolean
}

const SUGGESTIONS = [
  '300g Huhn Brust',
  '2 Eier mit Butter',
  '200g Lachs',
  'Tabak Tavuk + Pirinç',
  'Protein Shake 40g',
]

export default function FoodChat() {
  const { token } = useAuthStore()
  const { addMeal, todayCalories, todayProtein } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([{
    id: '0', role: 'bot',
    text: 'Was hast du gegessen? Schreib auf Deutsch, Türkisch oder Englisch — ich berechne Kalorien & Protein automatisch.',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json() as any

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'bot',
        text: data.antwort || 'Nicht erkannt.',
        items: data.erkannt && data.items?.length ? data.items : undefined,
      }])
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', text: 'Verbindungsfehler. Bitte erneut versuchen.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = (msg: Message) => {
    const today = new Date().toISOString().split('T')[0]
    const time = new Date().toTimeString().slice(0, 5)
    msg.items?.forEach(item => addMeal({ date: today, time, food_name: item.name, grams: item.grams, calories: item.calories, protein: item.protein }))
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, added: true } : m))
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 148px)' }}>

      {/* Today totals */}
      <div className="flex justify-around py-3 rounded-2xl mb-3 border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-center">
          <div className="font-mono font-bold text-lg" style={{ color: C.success }}>{todayCalories()}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>kcal heute</div>
        </div>
        <div className="w-px" style={{ background: C.borderLight }} />
        <div className="text-center">
          <div className="font-mono font-bold text-lg" style={{ color: C.info }}>{todayProtein()}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>g Protein</div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-xs px-4 py-3"
              style={{
                background: msg.role === 'user' ? C.info : C.bgSecondary,
                color: C.textPrimary,
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              }}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>

              {msg.items?.length && (
                <div className="mt-2 space-y-1">
                  {msg.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <span>{item.name} ({item.grams}g)</span>
                      <span className="font-mono ml-2" style={{ color: C.success }}>{item.calories} kcal · {item.protein}g P</span>
                    </div>
                  ))}
                  {!msg.added ? (
                    <button onClick={() => handleAdd(msg)} className="w-full mt-1.5 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: C.success }}>
                      ✓ Zum Tagebuch hinzufügen
                    </button>
                  ) : (
                    <p className="text-center text-xs mt-1.5 font-semibold" style={{ color: C.success }}>✓ Hinzugefügt!</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 text-sm rounded-2xl" style={{ background: C.bgSecondary, color: C.textTertiary, borderRadius: '18px 18px 18px 4px' }}>
              <span className="animate-pulse">Analysiere...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap border flex-shrink-0" style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-1 p-2 rounded-2xl border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="z.B. 300g Huhn, 2 Eier, Tavuk..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: C.textPrimary, padding: '6px 4px', border: 'none' }}
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: input.trim() && !loading ? C.info : C.bgTertiary }}
        >
          →
        </button>
      </div>
    </div>
  )
}
