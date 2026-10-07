import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verifyPassword, runDummyVerify, createToken, COOKIE_NAME } from '@/lib/auth'
import { authenticateWithFjordHub, ensureManagedLocalUser, isFjordHubManaged } from '@/lib/fjordhub'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 5
const MANAGED_WINDOW_MS = LOCK_MINUTES * 60 * 1000
const managedLoginFailures = new Map<string, number[]>()

function managedLoginKey(value: string): string {
  return value.trim().toLocaleLowerCase('en-US')
}

function managedLoginLocked(key: string): boolean {
  const now = Date.now()
  const recent = (managedLoginFailures.get(key) || []).filter(stamp => now - stamp < MANAGED_WINDOW_MS)
  if (recent.length) managedLoginFailures.set(key, recent)
  else managedLoginFailures.delete(key)
  return recent.length >= MAX_ATTEMPTS
}

function recordManagedLoginFailure(key: string): void {
  const now = Date.now()
  const recent = (managedLoginFailures.get(key) || []).filter(stamp => now - stamp < MANAGED_WINDOW_MS)
  if (!managedLoginFailures.has(key) && managedLoginFailures.size >= 4096) {
    const oldest = managedLoginFailures.keys().next().value
    if (oldest) managedLoginFailures.delete(oldest)
  }
  managedLoginFailures.set(key, [...recent, now])
}

function clearManagedLoginFailures(key: string): void {
  managedLoginFailures.delete(key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const { password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Brugernavn og adgangskode er påkrævet' }, { status: 400 })
    }

    if (isFjordHubManaged()) {
      const managedKey = managedLoginKey(username)
      if (managedLoginLocked(managedKey)) {
        return NextResponse.json(
          { error: `For mange fejlforsøg. Kontoen er låst i ${LOCK_MINUTES} minutter.` },
          { status: 429 }
        )
      }
      const hubUser = await authenticateWithFjordHub(username, password)
      if (!hubUser) {
        recordManagedLoginFailure(managedKey)
        return NextResponse.json(
          { error: 'Forkert login eller ingen adgang til OrbitMap i FjordHub' },
          { status: 401 }
        )
      }
      clearManagedLoginFailures(managedKey)
      if (hubUser.must_change_password) {
        // Første login efter oprettelse: brugeren skal selv vælge en ny adgangskode
        return NextResponse.json(
          { passwordChangeRequired: true, error: 'Du skal vælge en ny adgangskode før du kan logge ind' },
          { status: 403 }
        )
      }
      const user = await ensureManagedLocalUser(hubUser)
      const token = await createToken({ userId: user.id, username: user.username })
      const response = NextResponse.json({ success: true, username: user.username })
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: req.nextUrl.protocol === 'https:',
        maxAge: 8 * 60 * 60,
        path: '/',
      })
      return response
    }

    const result = await pool.query(
      'SELECT id, username, password_hash, failed_attempts, locked_until FROM users WHERE username = $1',
      [username]
    )
    const user = result.rows[0]

    if (!user) {
      await runDummyVerify()
      return NextResponse.json({ error: 'Forkert brugernavn eller adgangskode' }, { status: 401 })
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json(
        { error: 'Kontoen er midlertidigt låst', lockedUntil: user.locked_until },
        { status: 423 }
      )
    }

    const valid = await verifyPassword(user.password_hash, password)

    if (!valid) {
      const newAttempts = (user.failed_attempts ?? 0) + 1

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
        await pool.query(
          'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
          [newAttempts, lockedUntil, user.id]
        )
        return NextResponse.json(
          { error: `For mange fejlforsøg. Kontoen er låst i ${LOCK_MINUTES} minutter.` },
          { status: 423 }
        )
      }

      await pool.query('UPDATE users SET failed_attempts = $1 WHERE id = $2', [newAttempts, user.id])
      const left = MAX_ATTEMPTS - newAttempts
      return NextResponse.json(
        { error: `Forkert adgangskode. ${left} forsøg tilbage.` },
        { status: 401 }
      )
    }

    await pool.query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1', [user.id])

    const token = await createToken({ userId: user.id, username: user.username })

    const response = NextResponse.json({ success: true, username: user.username })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: req.nextUrl.protocol === 'https:',
      maxAge: 8 * 60 * 60,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}
