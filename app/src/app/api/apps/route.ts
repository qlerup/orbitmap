import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { APP_COLORS } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const result = await pool.query(`
    SELECT a.id, a.name, a.description, a.color,
           COUNT(ri.id) FILTER (WHERE ri.type = 'bug'  AND ri.status != 'done')::int AS bug_count,
           COUNT(ri.id) FILTER (WHERE ri.type = 'idea' AND ri.status != 'done')::int AS idea_count,
           COUNT(ri.id) FILTER (WHERE ri.type = 'feature' AND ri.status != 'done')::int AS feature_count,
           COUNT(ri.id) FILTER (WHERE ri.status = 'in_progress')::int AS in_progress_count,
           COUNT(ri.id) FILTER (WHERE ri.status != 'done')::int AS open_count
    FROM apps a
    LEFT JOIN roadmap_items ri ON ri.app_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at ASC
  `)

  return NextResponse.json({ apps: result.rows })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() || null : null
  const color = APP_COLORS.includes(body.color) ? body.color : APP_COLORS[0]

  if (!name) return NextResponse.json({ error: 'Navn er påkrævet' }, { status: 400 })
  if (name.length > 100) return NextResponse.json({ error: 'Navnet er for langt' }, { status: 400 })

  const result = await pool.query(
    `INSERT INTO apps (name, description, color) VALUES ($1, $2, $3)
     RETURNING id, name, description, color`,
    [name, description, color]
  )

  return NextResponse.json(result.rows[0])
}
