import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isFjordHubManaged } from '@/lib/fjordhub'

export async function GET() {
  try {
    await pool.query('SELECT 1')
    return NextResponse.json({
      ok: true,
      service: 'orbitmap',
      database: 'connected',
      fjordhubManaged: isFjordHubManaged(),
    })
  } catch {
    return NextResponse.json(
      { ok: false, service: 'orbitmap', database: 'unavailable' },
      { status: 503 }
    )
  }
}
