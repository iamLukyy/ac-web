import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'
import crypto from 'node:crypto'

const SESSION_COOKIE = 'ac-admin-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// In-memory session store (simple, resets on restart)
const sessions = new Map<string, { createdAt: number }>()

export function createSession(event: H3Event): string {
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { createdAt: Date.now() })

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  })

  return token
}

export function verifySession(event: H3Event): boolean {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return false

  const session = sessions.get(token)
  if (!session) return false

  // Check if session is expired
  if (Date.now() - session.createdAt > SESSION_MAX_AGE * 1000) {
    sessions.delete(token)
    return false
  }

  return true
}

export function destroySession(event: H3Event): void {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    sessions.delete(token)
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export function requireAuth(event: H3Event): void {
  if (!verifySession(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
}
