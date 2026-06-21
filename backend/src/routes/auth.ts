import { ok, err } from '../utils/response'
import { hashPassword, verifyPassword } from '../utils/password'
import { generateToken, verifyToken } from '../utils/jwt'

export async function register(req: Request, env: Env): Promise<Response> {
  const body = await req.json<{ name: string; email: string; password: string }>()
  const { name, email, password } = body

  if (!name || !email || !password) return err('Alle Felder erforderlich', 400)
  if (password.length < 8) return err('Passwort min. 8 Zeichen', 400)

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) return err('E-Mail bereits registriert', 409)

  const id = crypto.randomUUID()
  const hash = await hashPassword(password)

  await env.DB.prepare(
    'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)'
  ).bind(id, name, email, hash).run()

  const token = await generateToken(id, env)
  return ok({ token, user: { id, name, email } }, 201)
}

export async function login(req: Request, env: Env): Promise<Response> {
  const body = await req.json<{ email: string; password: string }>()
  const { email, password } = body

  if (!email || !password) return err('E-Mail und Passwort erforderlich', 400)

  const user = await env.DB.prepare(
    'SELECT id, name, email, password_hash FROM users WHERE email = ?'
  ).bind(email).first<{ id: string; name: string; email: string; password_hash: string }>()

  if (!user) return err('Ungültige Zugangsdaten', 401)

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return err('Ungültige Zugangsdaten', 401)

  const token = await generateToken(user.id, env)
  return ok({ token, user: { id: user.id, name: user.name, email: user.email } })
}

export async function getMe(req: Request, env: Env): Promise<Response> {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return err('Nicht autorisiert', 401)

  const userId = await verifyToken(auth.slice(7), env)
  if (!userId) return err('Ungültiger Token', 401)

  const user = await env.DB.prepare(
    'SELECT id, name, email, age, height_cm, current_weight, target_weight, activity_level, protein_goal, water_goal FROM users WHERE id = ?'
  ).bind(userId).first()

  if (!user) return err('Nutzer nicht gefunden', 404)
  return ok(user)
}

export async function updateProfile(req: Request, env: Env): Promise<Response> {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return err('Nicht autorisiert', 401)

  const userId = await verifyToken(auth.slice(7), env)
  if (!userId) return err('Ungültiger Token', 401)

  const body = await req.json<Record<string, unknown>>()
  const { age, height_cm, current_weight, target_weight, activity_level, water_goal, protein_goal } = body

  await env.DB.prepare(
    `UPDATE users SET age=?, height_cm=?, current_weight=?, target_weight=?, 
     activity_level=?, water_goal=?, protein_goal=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(age, height_cm, current_weight, target_weight, activity_level, water_goal, protein_goal, userId).run()

  return ok({ success: true })
}
