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

const DEFAULT_GRAMS: Record<string, number> = {
  'Ei': 60, 'Rührei': 120, 'Scrambled Eggs': 120,
  'Ayran': 250, 'Kaffee': 200, 'Çay': 200, 'Bier': 330,
  'Protein Shake': 300, 'Protein Bar': 60,
  'Baklava': 50, 'Lokum': 10, 'Simit': 120,
  'Berliner': 80, 'Croissant': 70,
}

// Local fuzzy search — kein API Key nötig
function searchLocal(input: string): { food: typeof FOOD_DB[0]; grams: number } | null {
  const text = input.toLowerCase().trim()

  // Extract grams if mentioned: "300g", "300 g", "300 gram"
  const gramMatch = text.match(/(\d+)\s*(?:g|gr|gram|gramm)/i)
  let grams = gramMatch ? parseInt(gramMatch[1]) : 0

  // Keywords to search
  const keywords = text
    .replace(/\d+\s*(?:g|gr|gram|gramm)/gi, '')
    .replace(/\b(mit|und|and|ile|yedim|gegessen|ate|had|essen|ich|ein|eine|zwei|drei|tane|adet|piece|pieces)\b/gi, '')
    .trim()

  if (!keywords) return null

  // Scoring: exact > starts with > contains
  let best: typeof FOOD_DB[0] | null = null
  let bestScore = 0

  for (const food of FOOD_DB) {
    const fname = food.name.toLowerCase()
    let score = 0

    if (fname === keywords) score = 100
    else if (fname.startsWith(keywords)) score = 80
    else if (fname.includes(keywords)) score = 60
    else {
      // partial word match
      const words = keywords.split(/\s+/)
      const matchedWords = words.filter(w => w.length > 2 && fname.includes(w))
      if (matchedWords.length > 0) score = matchedWords.length * 20
    }

    if (score > bestScore) {
      bestScore = score
      best = food
    }
  }

  if (!best || bestScore < 20) return null

  // Default grams
  if (!grams) {
    for (const [key, val] of Object.entries(DEFAULT_GRAMS)) {
      if (best.name.toLowerCase().includes(key.toLowerCase())) {
        grams = val
        break
      }
    }
    if (!grams) grams = 100
  }

  return { food: best, grams }
}

// Parse "2 Eier" → multiplier
function parseMultiplier(text: string): number {
  const m = text.match(/^(\d+)\s+/)
  return m ? parseInt(m[1]) : 1
}

// Parse multiple foods from input
function parseInput(input: string): FoodItem[] {
  const results: FoodItem[] = []
  
  // Split by common connectors
  const parts = input.split(/\s*[+,&\/]\s*|\s+und\s+|\s+ile\s+|\s+and\s+/i)

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const multi = parseMultiplier(trimmed)
    const result = searchLocal(trimmed)

    if (result) {
      const { food, grams } = result
      const totalGrams = grams * (multi > 1 ? multi : 1)
      results.push({
        name: food.name,
        grams: totalGrams,
        calories: calcCalories(food.kcal, totalGrams),
        protein: calcProtein(food.protein, totalGrams),
        origin: food.origin,
      })
    }
  }

  return results
}

const SUGGESTIONS = [
  '300g Huhn Brust', '2 Eier', 'Pirinç Pilavı 200g',
  'Lachs 200g', 'Köfte 150g', 'Ayran',
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

    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 400))

    const items = parseInput(userText)

    if (items.length > 0) {
      const totalKcal = items.reduce((s, i) => s + i.calories, 0)
      const totalProt = items.reduce((s, i) => s + i.protein, 0)
      const reply = items.length === 1
        ? `${items[0].name} (${items[0].grams}g) — ${items[0].calories} kcal, ${items[0].protein}g Protein.`
        : `${items.length} Mahlzeiten erkannt — gesamt ${totalKcal} kcal, ${totalProt}g Protein.`

      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', text: reply, items }])
    } else {
      // Suggest closest matches
      const searchText = userText.toLowerCase()
      const suggestions = FOOD_DB
        .filter(f => f.name.toLowerCase().includes(searchText.slice(0, 4)))
        .slice(0, 3)
        .map(f => f.name)

      const hint = suggestions.length > 0
        ? `Meintest du: ${suggestions.join(', ')}?`
        : 'Nicht erkannt. Versuche z.B. "300g Huhn", "Pirinç 200g", "2 Eier".'

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
            <div
              className="max-w-xs px-4 py-3"
              style={{
                background: msg.role === 'user' ? C.info : C.bgSecondary,
                color: C.textPrimary,
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                maxWidth: '85%',
              }}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>

              {msg.items && msg.items.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <span>{ORIGIN_FLAGS[item.origin || 'INT']} {item.name} ({item.grams}g)</span>
                      <span className="font-mono ml-2" style={{ color: C.success }}>
                        {item.calories} · {item.protein}g P
                      </span>
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
              <span className="animate-pulse">...</span>
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
          placeholder="z.B. 300g Huhn, Pirinç, 2 Eier..."
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
