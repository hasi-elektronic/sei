import { ok, err } from '../utils/response'
import { verifyToken } from '../utils/jwt'

export async function chatHandler(req: Request, env: any): Promise<Response> {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return err('Nicht autorisiert', 401)

  const userId = await verifyToken(auth.slice(7), env)
  if (!userId) return err('Ungültiger Token', 401)

  const body = await req.json<{ message: string }>()
  const { message } = body
  if (!message?.trim()) return err('Nachricht fehlt', 400)

  const systemPrompt = `Du bist ein präziser Ernährungsassistent für die SEI Fasting App.

Der Nutzer schreibt auf Deutsch, Türkisch oder Englisch was er gegessen hat.
Du analysierst die Mahlzeit und antwortest NUR mit einem JSON-Objekt — kein Text davor oder danach.

Format:
{
  "erkannt": true,
  "items": [
    {
      "name": "Lebensmittelname auf Deutsch",
      "grams": 300,
      "calories": 495,
      "protein": 52
    }
  ],
  "total_calories": 495,
  "total_protein": 52,
  "antwort": "Kurze freundliche Bestätigung auf Deutsch (max 1 Satz)"
}

Wenn du nichts Erkennbares findest:
{
  "erkannt": false,
  "antwort": "Ich habe leider keine Mahlzeit erkannt. Bitte beschreibe was du gegessen hast."
}

Wichtig:
- Kalorien und Protein immer pro gesamte Menge (nicht pro 100g)
- Wenn keine Gramm angegeben: typische Portion schätzen
- Namen auf Deutsch
- Sei präzise, keine langen Erklärungen`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Anthropic error:', errText)
    return err('KI-Fehler', 500)
  }

  const data = await response.json<any>()
  const text = data.content?.[0]?.text || ''

  try {
    const parsed = JSON.parse(text)
    return ok(parsed)
  } catch {
    return ok({ erkannt: false, antwort: 'Fehler beim Verarbeiten der Antwort.' })
  }
}
