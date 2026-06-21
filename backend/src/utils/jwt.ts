import { SignJWT, jwtVerify } from 'jose'

function getSecret(env: Env): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET || 'sei-default-secret-change-in-prod')
}

export async function generateToken(userId: string, env: Env): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(getSecret(env))
}

export async function verifyToken(token: string, env: Env): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(env))
    return payload.userId as string
  } catch {
    return null
  }
}
