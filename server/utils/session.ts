import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'
import crypto from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SESSION_COOKIE = 'ac-admin-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const SESSION_FILE = join(process.cwd(), '.sessions.json')

// Persistent session store (survives PM2 restarts)
let sessions: Map<string, { createdAt: number }>

function loadSessions(): Map<string, { createdAt: number }> {
  try {
    if (existsSync(SESSION_FILE)) {
      const data = JSON.parse(readFileSync(SESSION_FILE, 'utf-8'))
      return new Map(Object.entries(data))
    }
  } catch { /* ignore */ }
  return new Map()
}

function saveSessions() {
  try {
    const obj: Record<string, { createdAt: number }> = {}
    sessions.forEach((v, k) => { obj[k] = v })
    writeFileSync(SESSION_FILE, JSON.stringify(obj))
  } catch { /* ignore */ }
}

function getSessions() {
  if (!sessions) sessions = loadSessions()
  return sessions
}

export function createSession(event: H3Event): string {
  const store = getSessions()
  const token = crypto.randomBytes(32).toString('hex')
  store.set(token, { createdAt: Date.now() })
  saveSessions()

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  })

  return token
}

export function verifySession(event: H3Event): boolean {
  const store = getSessions()
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return false

  const session = store.get(token)
  if (!session) return false

  // Check if session is expired
  if (Date.now() - session.createdAt > SESSION_MAX_AGE * 1000) {
    store.delete(token)
    saveSessions()
    return false
  }

  return true
}

export function destroySession(event: H3Event): void {
  const store = getSessions()
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    store.delete(token)
    saveSessions()
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
