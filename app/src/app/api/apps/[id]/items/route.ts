import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'

const VALID_TYPES = ['idea', 'bug', 'feature']
const VALID_STATUSES = ['backlog', 'planned', 'in_progress', 'done']
const VALID_PRIORITIES = ['low', 'medium', 'high']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const { id } = await params
  const result = await pool.query(
    `SELECT id, app_id, type, title, description, status, priority, position, created_at
     FROM roadmap_items
     WHERE app_id = $1
     ORDER BY status, position ASC, created_at ASC`,
    [id]
  )

  return NextResponse.json({ items: result.rows })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() || null : null
  const type = VALID_TYPES.includes(body.type) ? body.type : 'idea'
  const status = VALID_STATUSES.includes(body.status) ? body.status : 'backlog'
  const priority = VALID_PRIORITIES.includes(body.priority) ? body.priority : 'medium'

  if (!title) return NextResponse.json({ error: 'Titel er påkrævet' }, { status: 400 })
  if (title.length > 255) return NextResponse.json({ error: 'Titlen er for lang' }, { status: 400 })

  const appCheck = await pool.query('SELECT 1 FROM apps WHERE id = $1', [id])
  if (!appCheck.rowCount) return NextResponse.json({ error: 'App ikke fundet' }, { status: 404 })

  // Placeres sidst i kolonnen
  const result = await pool.query(
    `INSERT INTO roadmap_items (app_id, type, title, description, status, priority, position)
     SELECT $1, $2, $3, $4, $5, $6, COALESCE(MAX(position), 0) + 1000
     FROM roadmap_items WHERE app_id = $1 AND status = $5
     RETURNING id, app_id, type, title, description, status, priority, position, created_at`,
    [id, type, title, description, status, priority]
  )

  return NextResponse.json(result.rows[0])
}
