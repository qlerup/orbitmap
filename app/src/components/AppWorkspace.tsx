'use client'

import { useState } from 'react'
import KanbanBoard from './KanbanBoard'
import RoadmapView from './RoadmapView'
import ItemEditModal from './ItemEditModal'
import type { TrackedApp, RoadmapItem } from '@/lib/types'

interface Props {
  app: TrackedApp
  initialItems: RoadmapItem[]
}

type View = 'roadmap' | 'board'

const VIEWS: Array<{ key: View; label: string; icon: React.ReactNode }> = [
  {
    key: 'roadmap',
    label: 'Roadmap',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    key: 'board',
    label: 'Tavle',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
]

export default function AppWorkspace({ app, initialItems }: Props) {
  const [items, setItems] = useState<RoadmapItem[]>(initialItems)
  const [view, setView] = useState<View>('roadmap')
  const [editItem, setEditItem] = useState<RoadmapItem | null>(null)

  function handleItemCreated(item: RoadmapItem) {
    setItems(prev => [...prev, item])
  }

  function handleItemUpdated(updated: RoadmapItem) {
    setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)))
    setEditItem(null)
  }

  function handleItemDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setEditItem(null)
  }

  return (
    <>
      <div className="flex justify-end mb-5 fade-up" style={{ animationDelay: '100ms' }}>
        <div className="inline-flex glass p-1 gap-1">
          {VIEWS.map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-xl transition-all duration-200 ${
                view === v.key
                  ? 'bg-orbit-500/20 text-orbit-200 border border-orbit-400/40 shadow-[0_0_16px_-4px_rgba(129,140,248,0.5)]'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'roadmap' ? (
        <RoadmapView
          apps={[app]}
          items={items}
          setItems={setItems}
          onItemCreated={handleItemCreated}
          onItemClick={setEditItem}
        />
      ) : (
        <KanbanBoard
          app={app}
          items={items}
          setItems={setItems}
          onItemCreated={handleItemCreated}
          onCardClick={setEditItem}
        />
      )}

      {editItem && (
        <ItemEditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onUpdated={handleItemUpdated}
          onDeleted={handleItemDeleted}
        />
      )}
    </>
  )
}
