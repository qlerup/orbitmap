import { redirect } from 'next/navigation'
import pool from '@/lib/db'
import SetupForm from '@/components/SetupForm'
import OrbitLogo from '@/components/OrbitLogo'
import { isFjordHubManaged } from '@/lib/fjordhub'

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  if (isFjordHubManaged()) redirect('/login')
  let userCount = 0
  let dbError = false
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM users')
    userCount = result.rows[0].count
  } catch {
    dbError = true
  }

  if (!dbError && userCount > 0) redirect('/login')

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-up">
          <div className="inline-flex mb-5">
            <OrbitLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Velkommen til <span className="text-gradient">Orbitmap</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">Opret din konto for at komme i gang</p>
        </div>

        <div className="card fade-up" style={{ animationDelay: '120ms' }}>
          {dbError ? (
            <p className="text-sm text-red-400 text-center">
              Databasen er ikke tilgængelig endnu. Prøv at genindlæse siden om et øjeblik.
            </p>
          ) : (
            <SetupForm />
          )}
        </div>
      </div>
    </main>
  )
}
