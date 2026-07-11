import Link from 'next/link'
import pool from '@/lib/db'
import AppGrid from '@/components/AppGrid'
import type { AppWithStats } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface StatTile {
  label: string
  value: string
  accent: string
  icon: React.ReactNode
}

export default async function DashboardPage() {
  const result = await pool.query(`
    SELECT a.id, a.name, a.description, a.color,
           COUNT(ri.id) FILTER (WHERE ri.type = 'bug'  AND ri.status != 'done')::int AS bug_count,
           COUNT(ri.id) FILTER (WHERE ri.type = 'idea' AND ri.status != 'done')::int AS idea_count,
           COUNT(ri.id) FILTER (WHERE ri.type = 'feature' AND ri.status != 'done')::int AS feature_count,
           COUNT(ri.id) FILTER (WHERE ri.status = 'in_progress')::int AS in_progress_count,
           COUNT(ri.id) FILTER (WHERE ri.status != 'done')::int AS open_count,
           COUNT(ri.id) FILTER (WHERE ri.status = 'done')::int AS done_count,
           COUNT(ri.id)::int AS total_count
    FROM apps a
    LEFT JOIN roadmap_items ri ON ri.app_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at ASC
  `)
  const apps = result.rows as AppWithStats[]

  const totalOpen = apps.reduce((sum, a) => sum + a.open_count, 0)
  const totalInProgress = apps.reduce((sum, a) => sum + a.in_progress_count, 0)
  const totalDone = apps.reduce((sum, a) => sum + a.done_count, 0)
  const totalAll = apps.reduce((sum, a) => sum + a.total_count, 0)
  const donePct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  const tiles: StatTile[] = [
    {
      label: apps.length === 1 ? 'App i kredsløb' : 'Apps i kredsløb',
      value: String(apps.length),
      accent: 'text-orbit-300 bg-orbit-400/10 border-orbit-400/20',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="4.5" />
          <path strokeLinecap="round" d="M18.6 7.2c2.2 1 3.4 2.2 3.4 3.3 0 2.5-4.5 4.5-10 4.5S2 13 2 10.5c0-1.1 1.2-2.3 3.4-3.3" transform="rotate(-25 12 12)" />
        </svg>
      ),
    },
    {
      label: 'Åbne punkter',
      value: String(totalOpen),
      accent: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'I gang',
      value: String(totalInProgress),
      accent: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: 'Fuldført',
      value: `${donePct}%`,
      accent: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Mission <span className="text-gradient">Control</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {apps.length === 0
              ? 'Send din første app i kredsløb for at komme i gang'
              : 'Overblik over alle dine apps og deres roadmaps'}
          </p>
        </div>
        {apps.length > 0 && (
          <Link
            href="/dashboard/roadmap"
            className="btn-ghost !py-2 px-4 inline-flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Samlet roadmap
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {tiles.map((tile, i) => (
          <div
            key={tile.label}
            className="glass p-4 sm:p-5 fade-up"
            style={{ animationDelay: `${80 + i * 70}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${tile.accent}`}>
                {tile.icon}
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-white leading-none tabular-nums">{tile.value}</p>
                <p className="text-xs text-slate-400 mt-1.5 truncate">{tile.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AppGrid initialApps={apps} />
    </main>
  )
}
