import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'

const VALID_TYPES = ['idea', 'bug', 'feature']
const VALID_STATUSES = ['backlog', 'planned', 'in_progress', 'done']
const VALID_PRIORITIES = ['low', 'medium', 'high']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const title = typeof body.title === 'string' ? body.title.trim() : null
  const descriptionProvided = 'description' in body
  const description = typeof body.description === 'string' ? body.description.trim() || null : null
  const type = VALID_TYPES.includes(body.type) ? body.type : null
  const status = VALID_STATUSES.includes(body.status) ? body.status : null
  const priority = VALID_PRIORITIES.includes(body.priority) ? body.priority : null
  const position = typeof body.position === 'number' && Number.isFinite(body.position) ? body.position : null

  if (title !== null && !title) return NextResponse.json({ error: 'Titel kan ikke være tom' }, { status: 400 })

  const result = await pool.query(
    `UPDATE roadmap_items SET
       title = COALESCE($1, title),
       description = CASE WHEN $2 THEN $3 ELSE description END,
       type = COALESCE($4::roadmap_item_type, type),
       status = COALESCE($5::roadmap_item_status, status),
       priority = COALESCE($6::roadmap_item_priority, priority),
       position = COALESCE($7, position),
       updated_at = NOW()
     WHERE id = $8
     RETURNING id, app_id, type, title, description, status, priority, position, created_at`,
    [title, descriptionProvided, description, type, status, priority, position, id]
  )
  if (!result.rowCount) return NextResponse.json({ error: 'Punkt ikke fundet' }, { status: 404 })

  return NextResponse.json(result.rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const { id } = await params
  const result = await pool.query('DELETE FROM roadmap_items WHERE id = $1', [id])
  if (!result.rowCount) return NextResponse.json({ error: 'Punkt ikke fundet' }, { status: 404 })

  return NextResponse.json({ success: true })
}
