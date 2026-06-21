import { Router } from 'itty-router'
import { ok, err, corsOk } from './utils/response'
import { register, login, getMe, updateProfile } from './routes/auth'

declare global {
  interface Env {
    DB: D1Database
    JWT_SECRET?: string
  }
}

const router = Router()

// CORS preflight
router.options('*', corsOk)

// Health
router.get('/health', () => ok({ status: 'ok', service: 'SEI API v1' }))

// Auth
router.post('/auth/register', (req, env) => register(req, env))
router.post('/auth/login',    (req, env) => login(req, env))
router.get('/auth/me',        (req, env) => getMe(req, env))
router.put('/auth/profile',   (req, env) => updateProfile(req, env))

// 404
router.all('*', () => err('Nicht gefunden', 404))

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    return router.handle(req, env)
  },
}
