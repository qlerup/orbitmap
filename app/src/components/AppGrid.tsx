'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AddAppModal from './AddAppModal'
import EditAppModal from './EditAppModal'
import type { AppWithStats } from '@/lib/types'

interface Props {
  initialApps: AppWithStats[]
}

interface Chip {
  key: string
  label: string
  dot: string
}

function chips(app: AppWithStats): Chip[] {
  const list: Chip[] = []
  if (app.bug_count > 0) list.push({ key: 'bug', label: `${app.bug_count} fejl`, dot: 'bg-red-400' })
  if (app.idea_count > 0) list.push({ key: 'idea', label: `${app.idea_count} ${app.idea_count === 1 ? 'idé' : 'idéer'}`, dot: 'bg-amber-400' })
  if (app.feature_count > 0) list.push({ key: 'feature', label: `${app.feature_count} features`, dot: 'bg-sky-400' })
  if (app.in_progress_count > 0) list.push({ key: 'wip', label: `${app.in_progress_count} i gang`, dot: 'bg-violet-400' })
  return list
}

export default function AppGrid({ initialApps }: Props) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editApp, setEditApp] = useState<AppWithStats | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {initialApps.map((app, i) => {
          const progress = app.total_count > 0 ? Math.round((app.done_count / app.total_count) * 100) : 0
          const appChips = chips(app)

          return (
            <Link
              key={app.id}
              href={`/dashboard/apps/${app.id}`}
              className="app-card glass p-5 fade-up block relative group"
              style={{
                animationDelay: `${240 + i * 80}ms`,
                ['--glow' as string]: app.color,
              }}
            >
              <button
                type="button"
                onClick={e => {
                  e.preventDefault()
                  setEditApp(app)
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 hover:text-slate-200 hover:bg-white/10 transition-all duration-150"
                aria-label={`Rediger ${app.name}`}
                title="Rediger app"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <div className="flex items-center gap-4 mb-4 pr-7">
                <span className="relative inline-flex items-center justify-center w-11 h-11 shrink-0">
                  <span className="planet-orbit" style={{ ['--c' as string]: app.color }} />
                  <span
                    className="planet inline-flex items-center justify-center w-9 h-9 rounded-full text-white font-bold text-sm"
                    style={{ ['--c' as string]: app.color }}
                  >
                    {app.name[0]?.toUpperCase()}
                  </span>
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-white truncate">{app.name}</h2>
                  {app.description && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{app.description}</p>
                  )}
                </div>
              </div>

              {appChips.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {appChips.map(chip => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300 bg-white/5 border border-white/10 rounded-full px-2 py-0.5"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
                      {chip.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mb-4">
                  {app.total_count === 0 ? 'Ingen punkter endnu' : 'Alt er fuldført 🎉'}
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="bar-in h-full rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: app.color }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 tabular-nums shrink-0">
                  {progress}%
                </span>
              </div>
            </Link>
          )
        })}

        <button
          onClick={() => setShowAddModal(true)}
          className="fade-up min-h-[150px] rounded-2xl border-2 border-dashed border-white/15 text-slate-500
                     hover:border-orbit-400/60 hover:text-orbit-300 hover:bg-orbit-500/5
                     transition-all duration-200 flex flex-col items-center justify-center gap-2 group"
          style={{ animationDelay: `${240 + initialApps.length * 80}ms` }}
        >
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/15 group-hover:border-orbit-400/60 group-hover:rotate-90 transition-all duration-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </span>
          <span className="text-sm font-medium">Tilføj app</span>
        </button>
      </div>

      {showAddModal && (
        <AddAppModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false)
            router.refresh()
          }}
        />
      )}

      {editApp && (
        <EditAppModal
          app={editApp}
          onClose={() => setEditApp(null)}
          onSaved={() => {
            setEditApp(null)
            router.refresh()
          }}
          onDeleted={() => {
            setEditApp(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
