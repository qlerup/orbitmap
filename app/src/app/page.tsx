import { redirect } from 'next/navigation'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isFjordHubManaged } from '@/lib/fjordhub'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const managed = isFjordHubManaged()
  let userCount = 0
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM users')
    userCount = result.rows[0].count
  } catch {
    // DB ikke tilgængelig endnu - send til setup som viser fejl
    // (i managed mode ejer FjordHub brugerne, så /setup ville bare loope tilbage)
    if (!managed) redirect('/setup')
  }

  if (userCount === 0 && !managed) redirect('/setup')

  const session = await getSession()
  if (session) redirect('/dashboard')

  redirect('/login')
}
