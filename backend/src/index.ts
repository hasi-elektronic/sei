import { Router } from 'itty-router'
import { ok, err, corsOk } from './utils/response'
import { register, login, getMe, updateProfile } from './routes/auth'
import { chatHandler } from './routes/chat'

declare global {
  interface Env {
    DB: D1Database
    JWT_SECRET?: string
    ANTHROPIC_API_KEY?: string
  }
}

const router = Router()

router.options('*', corsOk)
router.get('/health', () => ok({ status: 'ok', service: 'SEI API v1' }))

// Auth
router.post('/auth/register', (req, env) => register(req, env))
router.post('/auth/login',    (req, env) => login(req, env))
router.get('/auth/me',        (req, env) => getMe(req, env))
router.put('/auth/profile',   (req, env) => updateProfile(req, env))

// AI Chat
router.post('/chat', (req, env) => chatHandler(req, env))

router.all('*', () => err('Nicht gefunden', 404))

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    return router.handle(req, env)
  },
}
