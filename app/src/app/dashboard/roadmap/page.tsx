import Link from 'next/link'
import pool from '@/lib/db'
import GlobalRoadmapWorkspace from '@/components/GlobalRoadmapWorkspace'
import type { TrackedApp, RoadmapItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function GlobalRoadmapPage() {
  const [appsResult, itemsResult] = await Promise.all([
    pool.query('SELECT id, name, description, color FROM apps ORDER BY created_at ASC'),
    pool.query(
      `SELECT id, app_id, type, title, description, status, priority, position, created_at
       FROM roadmap_items
       ORDER BY status, position ASC, created_at ASC`
    ),
  ])

  const apps = appsResult.rows as TrackedApp[]
  const items = itemsResult.rows as RoadmapItem[]

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 fade-up">
        <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Mission Control</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-200 font-medium">Samlet roadmap</span>
      </div>

      <div className="mb-8 fade-up" style={{ animationDelay: '60ms' }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Samlet <span className="text-gradient">roadmap</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Alle punkter fra alle dine apps på én tidslinje
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="glass p-10 text-center fade-up">
          <p className="text-sm text-slate-400">
            Du har ingen apps endnu.{' '}
            <Link href="/dashboard" className="text-orbit-300 hover:text-orbit-200 transition-colors font-medium">
              Tilføj din første app
            </Link>{' '}
            for at komme i gang.
          </p>
        </div>
      ) : (
        <GlobalRoadmapWorkspace apps={apps} initialItems={items} />
      )}
    </main>
  )
}
