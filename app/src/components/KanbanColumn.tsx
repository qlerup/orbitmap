'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import RoadmapItemCard from './RoadmapItemCard'
import type { RoadmapItem, ItemStatus } from '@/lib/types'

interface Props {
  status: ItemStatus
  label: string
  items: RoadmapItem[]
  appId: string
  index: number
  onItemCreated: (item: RoadmapItem) => void
  onCardClick: (item: RoadmapItem) => void
}

const COLUMN_ACCENTS: Record<ItemStatus, { bar: string; glow: string }> = {
  backlog:     { bar: 'from-slate-400/70 to-slate-500/20',   glow: 'text-slate-300' },
  planned:     { bar: 'from-sky-400 to-sky-500/20',          glow: 'text-sky-300' },
  in_progress: { bar: 'from-amber-400 to-amber-500/20',      glow: 'text-amber-300' },
  done:        { bar: 'from-emerald-400 to-emerald-500/20',  glow: 'text-emerald-300' },
}

export default function KanbanColumn({ status, label, items, appId, index, onItemCreated, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [quickTitle, setQuickTitle] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    const title = quickTitle.trim()
    if (!title || adding) return
    setAdding(true)
    try {
      const res = await fetch(`/api/apps/${appId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status }),
      })
      if (res.ok) {
        const item = await res.json()
        onItemCreated(item)
        setQuickTitle('')
      }
    } finally {
      setAdding(false)
    }
  }

  const accent = COLUMN_ACCENTS[status]

  return (
    <div
      ref={setNodeRef}
      className={`glass overflow-hidden fade-up transition-all duration-200 ${
        isOver ? 'border-orbit-400/60 bg-orbit-500/[0.07] shadow-[0_0_32px_-8px_rgba(129,140,248,0.5)]' : ''
      }`}
      style={{ animationDelay: `${140 + index * 80}ms` }}
    >
      <div className={`h-[3px] bg-gradient-to-r ${accent.bar}`} />

      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${accent.glow}`}>{label}</h2>
        <span className={`text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-full min-w-[24px] h-[24px] px-1.5 inline-flex items-center justify-center tabular-nums transition-transform duration-200 ${isOver ? 'scale-125 border-orbit-400/60' : ''}`}>
          {items.length}
        </span>
      </div>

      <form onSubmit={handleQuickAdd} className="px-2.5 pb-2">
        <input
          type="text"
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          placeholder="+ Tilføj punkt…"
          disabled={adding}
          className="w-full text-sm px-3 py-2 rounded-xl border border-transparent bg-white/[0.04] text-slate-200
                     placeholder-slate-500 focus:bg-white/[0.08] focus:border-white/10 focus:outline-none
                     focus:ring-2 focus:ring-orbit-400/70 transition-all disabled:opacity-50"
        />
      </form>

      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="px-2.5 pb-3 space-y-2 min-h-[90px]">
          {items.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-7 select-none">
              Ingen punkter endnu
            </p>
          ) : (
            items.map(item => (
              <RoadmapItemCard key={item.id} item={item} onClick={() => onCardClick(item)} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}
