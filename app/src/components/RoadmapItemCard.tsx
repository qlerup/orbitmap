'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PriorityBeacon from './PriorityBeacon'
import { TYPE_LABELS } from '@/lib/types'
import type { RoadmapItem, ItemType } from '@/lib/types'

interface Props {
  item: RoadmapItem
  onClick?: () => void
  isOverlay?: boolean
}

const TYPE_BADGES: Record<ItemType, string> = {
  idea: 'bg-amber-400/15 text-amber-300 border-amber-400/25',
  bug: 'bg-red-400/15 text-red-300 border-red-400/25',
  feature: 'bg-sky-400/15 text-sky-300 border-sky-400/25',
}

function CardBody({ item }: { item: RoadmapItem }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${TYPE_BADGES[item.type]}`}>
          {TYPE_LABELS[item.type]}
        </span>
        <span className="ml-auto -my-1 -mr-1">
          <PriorityBeacon priority={item.priority} />
        </span>
      </div>
      <p className="text-sm font-medium text-slate-100 leading-snug line-clamp-2">{item.title}</p>
      {item.description && (
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
      )}
    </>
  )
}

export default function RoadmapItemCard({ item, onClick, isOverlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: isOverlay,
  })

  if (isOverlay) {
    return (
      <div className="rounded-xl border border-orbit-400/50 bg-[#171a33]/95 backdrop-blur-xl p-3 cursor-grabbing scale-[1.04] rotate-2 shadow-[0_16px_48px_-8px_rgba(99,102,241,0.55)]">
        <CardBody item={item} />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`rounded-xl border border-white/10 bg-white/[0.05] p-3 cursor-grab active:cursor-grabbing
                  hover:border-orbit-400/40 hover:bg-white/[0.08] hover:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.35)]
                  transition-[border-color,background-color,box-shadow] duration-200
                  ${isDragging ? 'opacity-30' : ''}`}
    >
      <CardBody item={item} />
    </div>
  )
}
