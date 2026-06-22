import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { C } from '../../theme/colors'
import { calcCalories, calcProtein } from '../../utils/calculations'
import { FOOD_DB, CATEGORIES, ORIGIN_FLAGS, type Food } from '../../data/foodDatabase'

const today = () => new Date().toISOString().split('T')[0]
const now = () => new Date().toTimeString().slice(0, 5)

export default function AddMeal() {
  const { meals, addMeal, removeMeal, todayCalories, todayProtein } = useAppStore()
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('Alle')
  const [selected, setSelected] = useState<Food | null>(null)
  const [grams, setGrams] = useState(100)
  const [added, setAdded] = useState(false)

  const todayMeals = meals.filter(m => m.date === today())

  const filtered = FOOD_DB.filter(f =>
    (cat === 'Alle' || f.cat === cat) &&
    (f.name.toLowerCase().includes(search.toLowerCase()))
  )

  const preview = selected
    ? { kcal: calcCalories(selected.kcal, grams), protein: calcProtein(selected.protein, grams) }
    : null

  const handleAdd = () => {
    if (!selected || !preview) return
    addMeal({ date: today(), time: now(), food_name: selected.name, grams, calories: preview.kcal, protein: preview.protein })
    setSelected(null)
    setGrams(100)
    setSearch('')
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-3">
      {/* Today totals */}
      <div className="flex justify-around py-3 rounded-2xl border" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-center">
          <div className="font-mono font-bold text-xl" style={{ color: C.success }}>{todayCalories()}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>kcal heute</div>
        </div>
        <div className="w-px" style={{ background: C.borderLight }} />
        <div className="text-center">
          <div className="font-mono font-bold text-xl" style={{ color: C.info }}>{todayProtein()}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>g Protein</div>
        </div>
        <div className="w-px" style={{ background: C.borderLight }} />
        <div className="text-center">
          <div className="font-mono font-bold text-xl">{todayMeals.length}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>Mahlzeiten</div>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl p-4 border space-y-3" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setSelected(null) }}
          placeholder="🔍 Suche: Huhn, Pirinç, Salmon..."
        />

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => { setCat(c); setSelected(null) }}
              className="px-3 py-1 rounded-full text-xs whitespace-nowrap border flex-shrink-0"
              style={{
                background: cat === c ? C.info : 'transparent',
                borderColor: cat === c ? C.info : C.borderMedium,
                color: cat === c ? '#fff' : C.textSecondary,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Food list */}
        {!selected && (
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: C.textTertiary }}>
                Kein Ergebnis für "{search}"
              </p>
            )}
            {filtered.slice(0, 20).map(f => (
              <button
                key={f.name}
                onClick={() => { setSelected(f); setGrams(100) }}
                className="w-full text-left px-3 py-2 rounded-xl flex justify-between items-center"
                style={{ background: C.bgTertiary }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">{ORIGIN_FLAGS[f.origin]}</span>
                  <span className="text-sm">{f.name}</span>
                </div>
                <span className="text-xs flex-shrink-0 ml-2" style={{ color: C.textTertiary }}>
                  {f.kcal} kcal · {f.protein}g P
                </span>
              </button>
            ))}
            {filtered.length > 20 && (
              <p className="text-xs text-center pt-1" style={{ color: C.textTertiary }}>
                +{filtered.length - 20} weitere — Suche verfeinern
              </p>
            )}
          </div>
        )}

        {/* Selected food */}
        {selected && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{ORIGIN_FLAGS[selected.origin]}</span>
                <span className="font-medium text-sm">{selected.name}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs" style={{ color: C.textTertiary }}>✕ ändern</button>
            </div>

            <div>
              <label className="text-xs block mb-1" style={{ color: C.textSecondary }}>Gramm</label>
              <input
                type="number"
                value={grams}
                onChange={e => setGrams(Math.max(1, +e.target.value))}
                min={1}
                max={2000}
                className="text-center text-2xl font-mono"
              />
            </div>

            {preview && (
              <div className="flex justify-around py-3 rounded-xl" style={{ background: C.bgTertiary }}>
                <div className="text-center">
                  <div className="font-mono font-bold" style={{ color: C.success }}>{preview.kcal}</div>
                  <div className="text-xs" style={{ color: C.textTertiary }}>kcal</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold" style={{ color: C.info }}>{preview.protein}</div>
                  <div className="text-xs" style={{ color: C.textTertiary }}>g Protein</div>
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              className="w-full py-3 rounded-xl font-semibold text-white"
              style={{ background: added ? C.success : C.info }}
            >
              {added ? '✓ Hinzugefügt!' : '+ Hinzufügen'}
            </button>
          </div>
        )}
      </div>

      {/* Today's meals */}
      {todayMeals.length > 0 && (
        <div className="rounded-2xl p-4 border space-y-2" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Heute gegessen</div>
          {todayMeals.map(m => (
            <div key={m.id} className="flex justify-between items-center p-3 rounded-xl" style={{ background: C.bgTertiary }}>
              <div>
                <div className="text-sm font-medium">{m.food_name}</div>
                <div className="text-xs" style={{ color: C.textTertiary }}>{m.grams}g · {m.time}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-mono text-sm">{m.calories} kcal</div>
                  <div className="text-xs" style={{ color: C.textTertiary }}>{m.protein}g P</div>
                </div>
                <button onClick={() => removeMeal(m.id)} style={{ color: C.textTertiary }} className="text-xl leading-none">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
