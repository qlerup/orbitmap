import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { APP_COLORS } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const name = typeof body.name === 'string' ? body.name.trim() : null
  const descriptionProvided = 'description' in body
  const description = typeof body.description === 'string' ? body.description.trim() || null : null
  const color = APP_COLORS.includes(body.color) ? body.color : null

  if (name !== null && !name) return NextResponse.json({ error: 'Navn kan ikke være tomt' }, { status: 400 })

  const result = await pool.query(
    `UPDATE apps SET
       name = COALESCE($1, name),
       description = CASE WHEN $2 THEN $3 ELSE description END,
       color = COALESCE($4, color),
       updated_at = NOW()
     WHERE id = $5
     RETURNING id, name, description, color`,
    [name, descriptionProvided, description, color, id]
  )
  if (!result.rowCount) return NextResponse.json({ error: 'App ikke fundet' }, { status: 404 })

  return NextResponse.json(result.rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const { id } = await params
  const result = await pool.query('DELETE FROM apps WHERE id = $1', [id])
  if (!result.rowCount) return NextResponse.json({ error: 'App ikke fundet' }, { status: 404 })

  return NextResponse.json({ success: true })
}
