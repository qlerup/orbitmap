import { redirect } from 'next/navigation'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let userCount = 0
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM users')
    userCount = result.rows[0].count
  } catch {
    // DB ikke tilgængelig endnu - send til setup som viser fejl
    redirect('/setup')
  }

  if (userCount === 0) redirect('/setup')

  const session = await getSession()
  if (session) redirect('/dashboard')

  redirect('/login')
}
