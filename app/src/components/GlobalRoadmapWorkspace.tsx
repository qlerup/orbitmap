'use client'

import { useState } from 'react'
import RoadmapView from './RoadmapView'
import ItemEditModal from './ItemEditModal'
import type { TrackedApp, RoadmapItem } from '@/lib/types'

interface Props {
  apps: TrackedApp[]
  initialItems: RoadmapItem[]
}

export default function GlobalRoadmapWorkspace({ apps, initialItems }: Props) {
  const [items, setItems] = useState<RoadmapItem[]>(initialItems)
  const [editItem, setEditItem] = useState<RoadmapItem | null>(null)

  return (
    <>
      <RoadmapView
        apps={apps}
        items={items}
        setItems={setItems}
        onItemCreated={item => setItems(prev => [...prev, item])}
        onItemClick={setEditItem}
        showAppBadge
      />

      {editItem && (
        <ItemEditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onUpdated={updated => {
            setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)))
            setEditItem(null)
          }}
          onDeleted={id => {
            setItems(prev => prev.filter(i => i.id !== id))
            setEditItem(null)
          }}
        />
      )}
    </>
  )
}
