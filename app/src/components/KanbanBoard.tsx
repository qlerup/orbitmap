'use client'

import { useState, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import KanbanColumn from './KanbanColumn'
import RoadmapItemCard from './RoadmapItemCard'
import { STATUS_ORDER, STATUS_LABELS } from '@/lib/types'
import type { TrackedApp, RoadmapItem, ItemStatus } from '@/lib/types'

interface Props {
  app: TrackedApp
  items: RoadmapItem[]
  setItems: Dispatch<SetStateAction<RoadmapItem[]>>
  onItemCreated: (item: RoadmapItem) => void
  onCardClick: (item: RoadmapItem) => void
}

const STEP = 1000

export default function KanbanBoard({ app, items, setItems, onItemCreated, onCardClick }: Props) {
  const [activeItem, setActiveItem] = useState<RoadmapItem | null>(null)
  const [error, setError] = useState('')

  // Mus: træk efter 8px. Touch: hold fingeren nede et øjeblik, så siden stadig kan scrolles
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  const columns = useMemo(() => {
    const byStatus: Record<ItemStatus, RoadmapItem[]> = { backlog: [], planned: [], in_progress: [], done: [] }
    for (const item of items) byStatus[item.status].push(item)
    for (const status of STATUS_ORDER) byStatus[status].sort((a, b) => a.position - b.position)
    return byStatus
  }, [items])

  const findItem = useCallback((id: string) => items.find(i => i.id === id) ?? null, [items])

  // Kolonne-id'er er status-navnene; kort-id'er er item-uuids
  function resolveStatus(overId: string): ItemStatus | null {
    if ((STATUS_ORDER as string[]).includes(overId)) return overId as ItemStatus
    return findItem(overId)?.status ?? null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(findItem(String(event.active.id)))
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const targetStatus = resolveStatus(String(over.id))
    const item = findItem(activeId)
    if (!item || !targetStatus || item.status === targetStatus) return

    // Flyt live mellem kolonner mens man trækker (position afregnes ved drop)
    setItems(prev => prev.map(i => (i.id === activeId ? { ...i, status: targetStatus } : i)))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveItem(null)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const item = findItem(activeId)
    if (!item) return

    const targetStatus = resolveStatus(overId) ?? item.status
    const column = columns[targetStatus].filter(i => i.id !== activeId)

    // Find indsætningsindeks: hvis der droppes på et kort, indsæt på dets plads; ellers sidst
    let insertIndex = column.length
    if (overId !== activeId && !(STATUS_ORDER as string[]).includes(overId)) {
      const overIndex = column.findIndex(i => i.id === overId)
      if (overIndex !== -1) insertIndex = overIndex
    }

    const prevPos = insertIndex > 0 ? column[insertIndex - 1].position : null
    const nextPos = insertIndex < column.length ? column[insertIndex].position : null
    const newPosition =
      prevPos !== null && nextPos !== null ? (prevPos + nextPos) / 2
      : prevPos !== null ? prevPos + STEP
      : nextPos !== null ? nextPos - STEP
      : STEP

    const previousItems = items
    setItems(prev => prev.map(i => (i.id === activeId ? { ...i, status: targetStatus, position: newPosition } : i)))

    try {
      const res = await fetch(`/api/items/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, position: newPosition }),
      })
      if (!res.ok) throw new Error()
      setError('')
    } catch {
      setItems(previousItems)
      setError('Kunne ikke gemme flytningen – prøv igen')
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 alert-error">{error}</div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveItem(null)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {STATUS_ORDER.map((status, index) => (
            <KanbanColumn
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              items={columns[status]}
              appId={app.id}
              index={index}
              onItemCreated={onItemCreated}
              onCardClick={onCardClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && <RoadmapItemCard item={activeItem} isOverlay />}
        </DragOverlay>
      </DndContext>
    </>
  )
}
