import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM users')
    return NextResponse.json({ setupRequired: result.rows[0].count === 0 })
  } catch {
    return NextResponse.json({ error: 'Databasen er ikke tilgængelig' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Race-beskyttelse: setup kan kun køres når der ingen bruger findes
    const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM users')
    if (countResult.rows[0].count > 0) {
      return NextResponse.json({ error: 'Opsætning er allerede gennemført' }, { status: 400 })
    }

    const body = await req.json()
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const { password, confirmPassword } = body

    if (!username || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Udfyld alle felter' }, { status: 400 })
    }
    if (username.length < 3) {
      return NextResponse.json({ error: 'Brugernavn skal være mindst 3 tegn' }, { status: 400 })
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Adgangskoderne stemmer ikke overens' }, { status: 400 })
    }
    if (password.length < 12) {
      return NextResponse.json({ error: 'Adgangskoden skal være mindst 12 tegn' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, passwordHash]
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}
