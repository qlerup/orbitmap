import { notFound } from 'next/navigation'
import Link from 'next/link'
import pool from '@/lib/db'
import AppWorkspace from '@/components/AppWorkspace'
import type { TrackedApp, RoadmapItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AppBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [appResult, itemsResult] = await Promise.all([
    pool.query('SELECT id, name, description, color FROM apps WHERE id = $1', [id]),
    pool.query(
      `SELECT id, app_id, type, title, description, status, priority, position, created_at
       FROM roadmap_items
       WHERE app_id = $1
       ORDER BY status, position ASC, created_at ASC`,
      [id]
    ),
  ])

  const app = appResult.rows[0] as TrackedApp | undefined
  if (!app) notFound()

  const items = itemsResult.rows as RoadmapItem[]

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 fade-up">
        <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Mission Control</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-200 font-medium">{app.name}</span>
      </div>

      <div className="flex items-center gap-5 mb-8 fade-up" style={{ animationDelay: '60ms' }}>
        <span className="relative inline-flex items-center justify-center w-14 h-14 shrink-0">
          <span className="planet-orbit" style={{ ['--c' as string]: app.color }} />
          <span
            className="planet inline-flex items-center justify-center w-11 h-11 rounded-full text-white font-bold text-lg"
            style={{ ['--c' as string]: app.color }}
          >
            {app.name[0]?.toUpperCase()}
          </span>
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{app.name}</h1>
          {app.description && <p className="text-sm text-slate-400 mt-0.5">{app.description}</p>}
        </div>
      </div>

      <AppWorkspace app={app} initialItems={items} />
    </main>
  )
}
