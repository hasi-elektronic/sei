import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { C } from '../../theme/colors'
import { calcCalories, calcProtein } from '../../utils/calculations'

const FOOD_DB = [
  { name: 'Huhn Brust',        kcal: 165, protein: 31, cat: 'Protein' },
  { name: 'Huhn Oberschenkel', kcal: 209, protein: 26, cat: 'Protein' },
  { name: 'Rinderhack',        kcal: 250, protein: 26, cat: 'Protein' },
  { name: 'Lachs',             kcal: 208, protein: 20, cat: 'Protein' },
  { name: 'Thunfisch (Dose)',   kcal: 116, protein: 26, cat: 'Protein' },
  { name: 'Ei',                kcal: 155, protein: 13, cat: 'Protein' },
  { name: 'Magerquark',        kcal: 59,  protein: 12, cat: 'Protein' },
  { name: 'Käse (Gouda)',      kcal: 356, protein: 25, cat: 'Protein' },
  { name: 'Reis (weiß, gart.)',kcal: 130, protein: 3,  cat: 'Kohlenhydrate' },
  { name: 'Pasta (gart.)',     kcal: 131, protein: 5,  cat: 'Kohlenhydrate' },
  { name: 'Kartoffel (gart.)', kcal: 77,  protein: 2,  cat: 'Kohlenhydrate' },
  { name: 'Haferflocken',      kcal: 370, protein: 13, cat: 'Kohlenhydrate' },
  { name: 'Vollkornbrot',      kcal: 247, protein: 9,  cat: 'Kohlenhydrate' },
  { name: 'Olivenöl',          kcal: 900, protein: 0,  cat: 'Fette' },
  { name: 'Butter',            kcal: 717, protein: 0,  cat: 'Fette' },
  { name: 'Avocado',           kcal: 160, protein: 2,  cat: 'Fette' },
  { name: 'Nüsse (gemischt)',  kcal: 607, protein: 20, cat: 'Fette' },
  { name: 'Salat (gemischt)',  kcal: 15,  protein: 1,  cat: 'Gemüse' },
  { name: 'Tomate',            kcal: 18,  protein: 1,  cat: 'Gemüse' },
  { name: 'Gurke',             kcal: 12,  protein: 1,  cat: 'Gemüse' },
  { name: 'Brokkoli',          kcal: 34,  protein: 3,  cat: 'Gemüse' },
  { name: 'Spinat',            kcal: 23,  protein: 3,  cat: 'Gemüse' },
  { name: 'Banane',            kcal: 89,  protein: 1,  cat: 'Obst' },
  { name: 'Apfel',             kcal: 52,  protein: 0,  cat: 'Obst' },
  { name: 'Beeren (gemischt)', kcal: 50,  protein: 1,  cat: 'Obst' },
]

const CATS = ['Alle', 'Protein', 'Kohlenhydrate', 'Fette', 'Gemüse', 'Obst']
const today = () => new Date().toISOString().split('T')[0]
const now = () => new Date().toTimeString().slice(0, 5)

export default function AddMeal() {
  const { meals, addMeal, removeMeal, todayCalories, todayProtein } = useAppStore()
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('Alle')
  const [selected, setSelected] = useState<typeof FOOD_DB[0] | null>(null)
  const [grams, setGrams] = useState(100)
  const [added, setAdded] = useState(false)

  const todayMeals = meals.filter(m => m.date === today())
  const filtered = FOOD_DB.filter(f =>
    (cat === 'Alle' || f.cat === cat) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const preview = selected
    ? { kcal: calcCalories(selected.kcal, grams), protein: calcProtein(selected.protein, grams) }
    : null

  const handleAdd = () => {
    if (!selected) return
    addMeal({
      date: today(),
      time: now(),
      food_name: selected.name,
      grams,
      calories: preview!.kcal,
      protein: preview!.protein,
    })
    setSelected(null)
    setGrams(100)
    setSearch('')
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Today's total */}
      <div className="rounded-2xl p-4 border flex justify-around" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-center">
          <div className="font-mono font-bold text-xl">{todayCalories()}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>kcal heute</div>
        </div>
        <div className="w-px" style={{ background: C.borderLight }} />
        <div className="text-center">
          <div className="font-mono font-bold text-xl">{todayProtein()}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>g Protein</div>
        </div>
        <div className="w-px" style={{ background: C.borderLight }} />
        <div className="text-center">
          <div className="font-mono font-bold text-xl">{todayMeals.length}</div>
          <div className="text-xs" style={{ color: C.textTertiary }}>Mahlzeiten</div>
        </div>
      </div>

      {/* Search + Add Form */}
      <div className="rounded-2xl p-4 border space-y-3" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
        <div className="text-xs uppercase tracking-widest" style={{ color: C.textTertiary }}>Mahlzeit hinzufügen</div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setSelected(null) }}
          placeholder="Lebensmittel suchen..."
        />

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="px-3 py-1 rounded-full text-xs whitespace-nowrap border"
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
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.slice(0, 15).map(f => (
              <button
                key={f.name}
                onClick={() => setSelected(f)}
                className="w-full text-left p-2.5 rounded-xl flex justify-between items-center"
                style={{ background: C.bgTertiary }}
              >
                <span className="text-sm">{f.name}</span>
                <span className="text-xs" style={{ color: C.textTertiary }}>
                  {f.kcal} kcal | {f.protein}g P
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Selected food + gram input */}
        {selected && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{selected.name}</span>
              <button onClick={() => setSelected(null)} style={{ color: C.textTertiary }} className="text-xs">
                ✕ ändern
              </button>
            </div>

            <div>
              <label className="text-sm block mb-1" style={{ color: C.textSecondary }}>Gramm</label>
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
              <div className="flex justify-around py-2 rounded-xl" style={{ background: C.bgTertiary }}>
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

      {/* Today's meals list */}
      {todayMeals.length > 0 && (
        <div className="rounded-2xl p-4 border space-y-2" style={{ background: C.bgSecondary, borderColor: C.borderLight }}>
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Heute gegessen</div>
          {todayMeals.map(m => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: C.bgTertiary }}
            >
              <div>
                <div className="text-sm font-medium">{m.food_name}</div>
                <div className="text-xs" style={{ color: C.textTertiary }}>
                  {m.grams}g · {m.time}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-mono text-sm">{m.calories}</div>
                  <div className="text-xs" style={{ color: C.textTertiary }}>{m.protein}g P</div>
                </div>
                <button onClick={() => removeMeal(m.id)} style={{ color: C.textTertiary }} className="text-lg">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
