import type { H3Event } from 'h3'

const COOKIE = 'intern_admin'

function expectedPassword(): string {
  return process.env.NUXT_ADMIN_PASSWORD || useRuntimeConfig().adminPassword || ''
}

// Token is derived from the password so it stays valid across restarts without
// a session store, but never exposes the password itself to the client.
async function sessionToken(): Promise<string> {
  const secret = expectedPassword()
  const data = new TextEncoder().encode(`intern-admin:${secret}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(digest).toString('hex')
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i]
  return diff === 0
}

export async function login(event: H3Event, password: string): Promise<boolean> {
  const expected = expectedPassword()
  if (!expected) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Admin password belum diset di server (NUXT_ADMIN_PASSWORD).',
    })
  }
  if (!timingSafeEqualStr(password, expected)) return false

  setCookie(event, COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: !import.meta.dev,
    maxAge: 60 * 60 * 24 * 30,
  })
  return true
}

export function logout(event: H3Event): void {
  deleteCookie(event, COOKIE, { path: '/' })
}

export async function isAuthed(event: H3Event): Promise<boolean> {
  if (!expectedPassword()) return false
  const token = getCookie(event, COOKIE)
  if (!token) return false
  return timingSafeEqualStr(token, await sessionToken())
}

export async function requireAdmin(event: H3Event): Promise<void> {
  if (!(await isAuthed(event))) {
    throw createError({ statusCode: 401, statusMessage: 'Perlu login admin.' })
  }
}
