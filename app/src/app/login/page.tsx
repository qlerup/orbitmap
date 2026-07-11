import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isFjordHubManaged } from '@/lib/fjordhub'
import LoginForm from '@/components/LoginForm'
import OrbitLogo from '@/components/OrbitLogo'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  let userCount: number | null = null
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM users')
    userCount = result.rows[0].count
  } catch {
    userCount = null
  }

  // I FjordHub-managed mode oprettes brugere ved første hub-login,
  // så en tom users-tabel må ikke sende til /setup (giver redirect-loop)
  if (!isFjordHubManaged() && (userCount === null || userCount === 0)) redirect('/setup')

  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-up">
          <div className="inline-flex mb-5">
            <OrbitLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Orbitmap</h1>
          <p className="text-sm text-slate-400 mt-2">Log ind for at fortsætte</p>
        </div>

        <div className="card fade-up" style={{ animationDelay: '120ms' }}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
