import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { C } from '../../theme/colors'
import { calcCalories, calcProtein } from '../../utils/calculations'
import { FOOD_DB, ORIGIN_FLAGS } from '../../data/foodDatabase'

interface FoodItem { name: string; grams: number; calories: number; protein: number; origin?: string }
interface Message {
  id: string
  role: 'user' | 'bot'
  text: string
  items?: FoodItem[]
  added?: boolean
}

// Local search — returns best match with grams
function searchLocal(input: string): { name: string; grams: number; calories: number; protein: number; origin: string } | null {
  const text = input.toLowerCase().trim()

  // Extract explicit grams: "300g", "300 g", "300gr"
  const gramMatch = text.match(/(\d+)\s*(?:g|gr|gram|gramm)\b/i)
  let explicitGrams = gramMatch ? parseInt(gramMatch[1]) : 0

  // Extract multiplier: "2 Eier", "3 tane"
  const multiMatch = text.match(/^(\d+)\s+/)
  const multi = multiMatch ? parseInt(multiMatch[1]) : 1

  // Clean search term
  const clean = text
    .replace(/\d+\s*(?:g|gr|gram|gramm)\b/gi, '')
    .replace(/^(\d+)\s+/, '')
    .replace(/\b(mit|und|and|ile|yedim|gegessen|ate|had|tane|adet|piece|pieces|porsiyon|portion)\b/gi, '')
    .trim()

  if (clean.length < 2) return null

  // Score each food
  let best = null
  let bestScore = 0

  for (const food of FOOD_DB) {
    const fname = food.name.toLowerCase()
    let score = 0

    if (fname === clean) score = 100
    else if (fname.startsWith(clean)) score = 80
    else if (fname.includes(clean)) score = 60
    else {
      const words = clean.split(/\s+/).filter(w => w.length > 2)
      const matched = words.filter(w => fname.includes(w))
      if (matched.length > 0) score = matched.length * 25
    }

    if (score > bestScore) { bestScore = score; best = food }
  }

  if (!best || bestScore < 20) return null

  // Determine grams: explicit > multiplier × portion > portion
  let grams: number
  if (explicitGrams > 0) {
    grams = explicitGrams
  } else if (multi > 1) {
    grams = best.portion * multi
  } else {
    grams = best.portion  // default = typical portion!
  }

  return {
    name: best.name,
    grams,
    calories: calcCalories(best.kcal, grams),
    protein: calcProtein(best.protein, grams),
    origin: best.origin,
  }
}

function parseInput(input: string): FoodItem[] {
  const results: FoodItem[] = []
  const parts = input.split(/\s*[+,&\/]\s*|\s+und\s+|\s+ile\s+|\s+and\s+/i)

  for (const part of parts) {
    const r = searchLocal(part.trim())
    if (r) results.push(r)
  }
  return results
}

const SUGGESTIONS = [
  '300g Huhn Brust', '2 Eier', 'Pirinç Pilavı',
  'Lachs', 'Köfte', 'Mercimek Çorbası',
]

const today = () => new Date().toISOString().split('T')[0]
const nowTime = () => new Date().toTimeString().slice(0, 5)

export default function FoodChat() {
  const { addMeal, todayCalories, todayProtein } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([{
    id: '0', role: 'bot',
    text: 'Was hast du gegessen? Einfach eintippen — ich erkenne Deutsch, Türkisch und Englisch. Mengen optional: "300g Huhn", "2 Eier", "Pirinç".',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userText = text.trim()
    setInput('')
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: userText }])
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))

    const items = parseInput(userText)

    if (items.length > 0) {
      const totalKcal = items.reduce((s, i) => s + i.calories, 0)
      const totalProt = items.reduce((s, i) => s + i.protein, 0)

      const reply = items.length === 1
        ? `${items[0].name} (${items[0].grams}g) — ${items[0].calories} kcal, ${items[0].protein}g Protein.`
        : `${items.length} Mahlzeiten — ${totalKcal} kcal, ${totalProt}g Protein gesamt.`

      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', text: reply, items }])
    } else {
      const s = userText.toLowerCase().slice(0, 5)
      const hints = FOOD_DB.filter(f => f.name.toLowerCase().includes(s)).slice(0, 3).map(f => f.name)
      const hint = hints.length > 0
        ? `Meintest du: ${hints.join(', ')}?`
        : 'Nicht erkannt. z.B. "Huhn 300g", "2 Eier", "Pirinç Pilavı".'
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', text: hint }])
    }
    setLoading(false)
  }

  const handleAdd = (msg: Message) => {
    msg.items?.forEach(item => addMeal({
      date: today(), time: nowTime(),
      food_name: item.name, grams: item.grams,
      calories: item.calories, protein: item.protein,
    }))
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, added: true } : m))
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 148px)' }}>

      {/* Totals */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="px-4 py-3" style={{
              background: msg.role === 'user' ? C.info : C.bgSecondary,
              color: C.textPrimary,
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              maxWidth: '88%',
            }}>
              <p className="text-sm leading-relaxed">{msg.text}</p>

              {msg.items?.length && (
                <div className="mt-2 space-y-1">
                  {msg.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <span>{ORIGIN_FLAGS[item.origin || 'INT']} {item.name} ({item.grams}g)</span>
                      <span className="font-mono ml-2" style={{ color: C.success }}>{item.calories} kcal · {item.protein}g P</span>
                    </div>
                  ))}
                  {!msg.added ? (
                    <button onClick={() => handleAdd(msg)} className="w-full mt-1.5 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: C.success }}>
                      ✓ Zum Tagebuch hinzufügen
                    </button>
                  ) : (
                    <p className="text-center text-xs mt-1 font-semibold" style={{ color: C.success }}>✓ Hinzugefügt!</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 text-sm" style={{ background: C.bgSecondary, color: C.textTertiary, borderRadius: '18px 18px 18px 4px' }}>
              <span className="animate-pulse">···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1" style={{ scrollbarWidth: 'none' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap border flex-shrink-0"
              style={{ borderColor: C.borderMedium, color: C.textSecondary }}>
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
          placeholder="z.B. Pirinç, 300g Huhn, 2 Eier + Lachs..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: C.textPrimary, padding: '6px 4px', border: 'none' }}
          disabled={loading}
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: input.trim() && !loading ? C.info : C.bgTertiary }}>
          →
        </button>
      </div>
    </div>
  )
}
