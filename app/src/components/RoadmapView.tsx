'use client'

import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import ProgressRing from './ProgressRing'
import PriorityBeacon from './PriorityBeacon'
import { TYPE_LABELS } from '@/lib/types'
import type { TrackedApp, RoadmapItem, ItemStatus, ItemType, ItemPriority } from '@/lib/types'

interface Props {
  apps: TrackedApp[]
  items: RoadmapItem[]
  setItems: Dispatch<SetStateAction<RoadmapItem[]>>
  onItemCreated: (item: RoadmapItem) => void
  onItemClick: (item: RoadmapItem) => void
  showAppBadge?: boolean
}

interface Stage {
  status: ItemStatus
  title: string
  subtitle: string
  nodeClass: string
  titleClass: string
}

// Flowet læses oppefra og ned: idéer kommer ind i Senere og bevæger sig ned mod Leveret
const STAGES: Stage[] = [
  {
    status: 'backlog',
    title: 'Senere',
    subtitle: 'Backlog & idébank',
    nodeClass: 'bg-slate-400/15 border-slate-400/50 text-slate-300',
    titleClass: 'text-slate-300',
  },
  {
    status: 'planned',
    title: 'Næste',
    subtitle: 'Planlagt',
    nodeClass: 'bg-sky-400/20 border-sky-400/60 text-sky-300 shadow-[0_0_16px_-2px_rgba(56,189,248,0.5)]',
    titleClass: 'text-sky-300',
  },
  {
    status: 'in_progress',
    title: 'Nu',
    subtitle: 'I gang lige nu',
    nodeClass: 'stage-node-now bg-amber-400/20 border-amber-400/60 text-amber-300 shadow-[0_0_16px_-2px_rgba(251,191,36,0.6)]',
    titleClass: 'text-amber-300',
  },
  {
    status: 'done',
    title: 'Leveret',
    subtitle: 'Færdig',
    nodeClass: 'bg-emerald-400/20 border-emerald-400/60 text-emerald-300 shadow-[0_0_16px_-2px_rgba(52,211,153,0.5)]',
    titleClass: 'text-emerald-300',
  },
]

const STAGE_FLOW: ItemStatus[] = ['backlog', 'planned', 'in_progress', 'done']
const STAGE_TITLES: Record<ItemStatus, string> = { backlog: 'Senere', planned: 'Næste', in_progress: 'Nu', done: 'Leveret' }

function nextStatus(status: ItemStatus): ItemStatus | null {
  const idx = STAGE_FLOW.indexOf(status)
  return idx >= 0 && idx < STAGE_FLOW.length - 1 ? STAGE_FLOW[idx + 1] : null
}

const STEP = 1000

const PRIORITY_WEIGHT: Record<ItemPriority, number> = { high: 0, medium: 1, low: 2 }

const TYPE_STYLE: Record<ItemType, { chip: string; icon: React.ReactNode }> = {
  idea: {
    chip: 'bg-amber-400/15 text-amber-300 border-amber-400/25',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  bug: {
    chip: 'bg-red-400/15 text-red-300 border-red-400/25',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a3 3 0 013 3v5a3 3 0 11-6 0v-5a3 3 0 013-3zm0 0V5m-6 6H3m3 5H4m14-5h3m-5 5h2M8.5 5.5L7 4m8.5 1.5L17 4" />
      </svg>
    ),
  },
  feature: {
    chip: 'bg-sky-400/15 text-sky-300 border-sky-400/25',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4m7-2l1.5 4.5L20 9l-4.5 1.5L14 15l-1.5-4.5L8 9l4.5-1.5L14 3zM6 15v4m-2-2h4" />
      </svg>
    ),
  },
}

const QUICK_TYPES: ItemType[] = ['idea', 'bug', 'feature']

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

function RowBody({ item, dimmed, app }: { item: RoadmapItem; dimmed: boolean; app: TrackedApp | null }) {
  return (
    <>
      {app && (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-1.5 py-1 rounded-md border border-white/10 bg-white/5 text-slate-300 shrink-0 max-w-[110px]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: app.color, boxShadow: `0 0 6px ${app.color}` }} />
          <span className="truncate hidden sm:inline">{app.name}</span>
        </span>
      )}
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-1 rounded-md border shrink-0 ${TYPE_STYLE[item.type].chip}`}>
        {TYPE_STYLE[item.type].icon}
        <span className="hidden sm:inline">{TYPE_LABELS[item.type]}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium leading-snug truncate ${dimmed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
          {item.title}
        </span>
        {item.description && (
          <span className="block text-xs text-slate-500 truncate mt-0.5">{item.description}</span>
        )}
      </span>
      <span className="text-[11px] text-slate-600 tabular-nums shrink-0 hidden md:inline" suppressHydrationWarning>
        {formatDate(item.created_at)}
      </span>
      {!dimmed && <PriorityBeacon priority={item.priority} />}
    </>
  )
}

function DraggableRow({
  item,
  app,
  isDone,
  onOpen,
  onAdvance,
}: {
  item: RoadmapItem
  app: TrackedApp | null
  isDone: boolean
  onOpen: () => void
  onAdvance: (() => void) | null
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id })
  const next = nextStatus(item.status)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className={`roadmap-row w-full text-left rounded-xl border border-white/10 bg-white/[0.04] px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3
                  cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-orbit-400/70
                  ${isDone ? 'opacity-60 hover:opacity-100' : ''} ${isDragging ? 'opacity-30' : ''}`}
    >
      <RowBody item={item} dimmed={isDone} app={app} />
      {onAdvance && next && (
        <button
          type="button"
          title={`Ryk til ${STAGE_TITLES[next]}`}
          aria-label={`Ryk til ${STAGE_TITLES[next]}`}
          onClick={e => {
            e.stopPropagation()
            onAdvance()
          }}
          onPointerDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg border border-white/10 text-slate-500
                     hover:text-orbit-200 hover:border-orbit-400/50 hover:bg-orbit-500/15 hover:shadow-[0_0_12px_-2px_rgba(129,140,248,0.5)]
                     transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  )
}

function StageSection({
  stage,
  stageIndex,
  items,
  visibleItems,
  appsById,
  showAppBadge,
  isDragActive,
  showAllDone,
  onToggleShowAllDone,
  onOpen,
  onAdvance,
}: {
  stage: Stage
  stageIndex: number
  items: RoadmapItem[]
  visibleItems: RoadmapItem[]
  appsById: Map<string, TrackedApp>
  showAppBadge: boolean
  isDragActive: boolean
  showAllDone: boolean
  onToggleShowAllDone: () => void
  onOpen: (item: RoadmapItem) => void
  onAdvance: (item: RoadmapItem) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.status })
  const isDone = stage.status === 'done'

  return (
    <section
      ref={setNodeRef}
      className="relative fade-up"
      style={{ animationDelay: `${160 + stageIndex * 90}ms` }}
    >
      <div className="flex items-center gap-3 sm:gap-4 mb-3">
        <span
          className={`stage-node inline-flex items-center justify-center w-10 h-10 rounded-full border backdrop-blur-xl transition-transform duration-200 ${stage.nodeClass} ${
            isOver && isDragActive ? 'scale-125' : ''
          }`}
        >
          {stage.status === 'in_progress' && (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          {stage.status === 'planned' && (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {stage.status === 'backlog' && (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          )}
          {stage.status === 'done' && (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h2 className={`text-lg font-bold tracking-tight ${stage.titleClass}`}>{stage.title}</h2>
          <span className="text-xs text-slate-500 hidden sm:inline">{stage.subtitle}</span>
          <span className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-full min-w-[22px] h-[22px] px-1.5 inline-flex items-center justify-center tabular-nums">
            {items.length}
          </span>
        </div>
      </div>

      <div
        className={`ml-11 sm:ml-[52px] space-y-2 rounded-2xl transition-all duration-150 min-h-[44px] ${
          isDragActive ? 'outline-dashed outline-1 outline-white/15 p-2 -m-2 ml-9 sm:ml-[44px]' : ''
        } ${isOver && isDragActive ? 'bg-orbit-500/[0.07] outline-orbit-400/60 shadow-[0_0_24px_-8px_rgba(129,140,248,0.4)]' : ''}`}
      >
        {items.length === 0 ? (
          <p className="text-xs text-slate-600 py-2 select-none">
            {isDragActive
              ? 'Slip her'
              : stage.status === 'in_progress'
                ? 'Intet i gang – træk et punkt hertil'
                : 'Intet her endnu'}
          </p>
        ) : (
          <>
            {visibleItems.map(item => (
              <DraggableRow
                key={item.id}
                item={item}
                app={showAppBadge ? appsById.get(item.app_id) ?? null : null}
                isDone={isDone}
                onOpen={() => onOpen(item)}
                onAdvance={isDone ? null : () => onAdvance(item)}
              />
            ))}
            {isDone && items.length > 3 && (
              <button
                type="button"
                onClick={onToggleShowAllDone}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-1.5"
              >
                {showAllDone ? 'Vis færre' : `Vis alle ${items.length} leverede`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default function RoadmapView({ apps, items, setItems, onItemCreated, onItemClick, showAppBadge = false }: Props) {
  const [quickTitle, setQuickTitle] = useState('')
  const [quickType, setQuickType] = useState<ItemType>('idea')
  const [quickAppId, setQuickAppId] = useState<string>(apps[0]?.id ?? '')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [showAllDone, setShowAllDone] = useState(false)
  const [moveError, setMoveError] = useState('')
  const [activeItem, setActiveItem] = useState<RoadmapItem | null>(null)

  const itemsAtDragStart = useRef<RoadmapItem[] | null>(null)
  const dragOriginStatus = useRef<ItemStatus | null>(null)

  // Mus: træk efter 8px. Touch: hold fingeren nede et øjeblik, så siden stadig kan scrolles
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  const appsById = useMemo(() => new Map(apps.map(a => [a.id, a])), [apps])

  const grouped = useMemo(() => {
    const byStatus: Record<ItemStatus, RoadmapItem[]> = { backlog: [], planned: [], in_progress: [], done: [] }
    for (const item of items) byStatus[item.status].push(item)
    for (const status of ['backlog', 'planned', 'in_progress'] as ItemStatus[]) {
      byStatus[status].sort((a, b) =>
        PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] || a.position - b.position
      )
    }
    // Leveret: nyeste først
    byStatus.done.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return byStatus
  }, [items])

  const doneCount = grouped.done.length
  const totalCount = items.length
  const donePct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const openItems = grouped.backlog.concat(grouped.planned, grouped.in_progress)
  const openBugs = openItems.filter(i => i.type === 'bug').length
  const openFeatures = openItems.filter(i => i.type === 'feature').length
  const openIdeas = openItems.filter(i => i.type === 'idea').length
  const urgentCount = openItems.filter(i => i.priority === 'high').length

  function endPosition(target: ItemStatus, excludeId: string): number {
    const positions = items
      .filter(i => i.status === target && i.id !== excludeId)
      .map(i => i.position)
    return positions.length > 0 ? Math.max(...positions) + STEP : STEP
  }

  async function moveToStage(item: RoadmapItem, target: ItemStatus) {
    if (item.status === target) return
    const snapshot = items
    const newPosition = endPosition(target, item.id)

    setMoveError('')
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: target, position: newPosition } : i)))

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target, position: newPosition }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setItems(snapshot)
      setMoveError('Kunne ikke gemme flytningen – prøv igen')
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const item = items.find(i => i.id === String(event.active.id)) ?? null
    setActiveItem(item)
    itemsAtDragStart.current = items
    dragOriginStatus.current = item?.status ?? null
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const targetStatus = String(over.id) as ItemStatus
    if (!STAGE_FLOW.includes(targetStatus)) return
    const activeId = String(active.id)
    const item = items.find(i => i.id === activeId)
    if (!item || item.status === targetStatus) return

    // Live-forhåndsvisning: punktet hopper til etapen mens man trækker
    setItems(prev => prev.map(i => (i.id === activeId ? { ...i, status: targetStatus } : i)))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveItem(null)

    const origin = dragOriginStatus.current
    const snapshot = itemsAtDragStart.current
    dragOriginStatus.current = null
    itemsAtDragStart.current = null

    const activeId = String(active.id)
    const overId = over ? String(over.id) : null
    const targetStatus = overId && STAGE_FLOW.includes(overId as ItemStatus) ? (overId as ItemStatus) : null

    // Droppet udenfor en etape, eller tilbage hvor det kom fra → rul forhåndsvisningen tilbage
    if (!targetStatus || targetStatus === origin) {
      if (snapshot) setItems(snapshot)
      return
    }

    const newPosition = endPosition(targetStatus, activeId)
    setMoveError('')
    setItems(prev => prev.map(i => (i.id === activeId ? { ...i, status: targetStatus, position: newPosition } : i)))

    try {
      const res = await fetch(`/api/items/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, position: newPosition }),
      })
      if (!res.ok) throw new Error()
    } catch {
      if (snapshot) setItems(snapshot)
      setMoveError('Kunne ikke gemme flytningen – prøv igen')
    }
  }

  function handleDragCancel() {
    setActiveItem(null)
    if (itemsAtDragStart.current) setItems(itemsAtDragStart.current)
    itemsAtDragStart.current = null
    dragOriginStatus.current = null
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    const title = quickTitle.trim()
    if (!title || adding || !quickAppId) return
    setAdding(true)
    setAddError('')
    try {
      const res = await fetch(`/api/apps/${quickAppId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type: quickType, status: 'backlog' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error ?? 'Kunne ikke tilføje punktet')
        return
      }
      onItemCreated(data)
      setQuickTitle('')
    } catch {
      setAddError('Netværksfejl – prøv igen')
    } finally {
      setAdding(false)
    }
  }

  const activeApp = activeItem && showAppBadge ? appsById.get(activeItem.app_id) ?? null : null

  return (
    <div className="space-y-6">
      {/* Hero: fremdrift + åbne punkter */}
      <div className="glass p-5 sm:p-6 fade-up flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        <ProgressRing percent={donePct} />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-lg font-semibold text-white">
            {doneCount} af {totalCount} punkter leveret
          </p>
          <p className="text-sm text-slate-400 mt-0.5">
            {grouped.in_progress.length > 0
              ? `${grouped.in_progress.length} ${grouped.in_progress.length === 1 ? 'punkt' : 'punkter'} i gang lige nu`
              : 'Intet i gang lige nu'}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-3">
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-300 bg-red-500/15 border border-red-400/40 rounded-full px-2.5 py-1 prio-chip-high">
                ⚡ {urgentCount} haster
              </span>
            )}
            {openFeatures > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-300 bg-sky-400/10 border border-sky-400/20 rounded-full px-2.5 py-1">
                {TYPE_STYLE.feature.icon} {openFeatures} features på vej
              </span>
            )}
            {openBugs > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-300 bg-red-400/10 border border-red-400/20 rounded-full px-2.5 py-1">
                {TYPE_STYLE.bug.icon} {openBugs} {openBugs === 1 ? 'åben fejl' : 'åbne fejl'}
              </span>
            )}
            {openIdeas > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-full px-2.5 py-1">
                {TYPE_STYLE.idea.icon} {openIdeas} {openIdeas === 1 ? 'idé' : 'idéer'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hurtig indskydning */}
      <form onSubmit={handleQuickAdd} className="glass p-4 fade-up space-y-3" style={{ animationDelay: '80ms' }}>
        {apps.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
            {apps.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setQuickAppId(a.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border whitespace-nowrap transition-all duration-150 shrink-0 ${
                  quickAppId === a.id
                    ? 'border-white/40 bg-white/10 text-white'
                    : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
                }`}
                style={quickAppId === a.id ? { boxShadow: `0 0 14px -4px ${a.color}` } : undefined}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                {a.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1.5 shrink-0">
            {QUICK_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setQuickType(t)}
                className={`flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 sm:py-2 rounded-xl border transition-all duration-150 ${
                  quickType === t
                    ? TYPE_STYLE[t].chip + ' shadow-[0_0_14px_-4px_currentColor]'
                    : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
                }`}
              >
                {TYPE_STYLE[t].icon}
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            placeholder="Fik du en idé? Fandt du en fejl? Skriv den her…"
            maxLength={255}
            disabled={adding}
            className="input-field flex-1 !py-2.5 sm:!py-2"
          />
          <button
            type="submit"
            disabled={adding || !quickTitle.trim() || !quickAppId}
            className="btn-primary !py-2.5 sm:!py-2 !px-5 text-sm shrink-0"
          >
            {adding ? 'Tilføjer…' : 'Tilføj'}
          </button>
        </div>
        {addError && <p className="text-xs text-red-400">{addError}</p>}
      </form>

      {moveError && <div className="alert-error fade-up">{moveError}</div>}

      {/* Tidslinjen — træk punkter mellem etaperne, eller brug pilen på hvert punkt */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="relative">
          <div className="timeline-track" aria-hidden="true" />

          <div className="space-y-8">
            {STAGES.map((stage, stageIndex) => {
              const stageItems = grouped[stage.status]
              const isDone = stage.status === 'done'
              const visibleItems = isDone && !showAllDone ? stageItems.slice(0, 3) : stageItems

              return (
                <StageSection
                  key={stage.status}
                  stage={stage}
                  stageIndex={stageIndex}
                  items={stageItems}
                  visibleItems={visibleItems}
                  appsById={appsById}
                  showAppBadge={showAppBadge}
                  isDragActive={!!activeItem}
                  showAllDone={showAllDone}
                  onToggleShowAllDone={() => setShowAllDone(s => !s)}
                  onOpen={onItemClick}
                  onAdvance={item => {
                    const next = nextStatus(item.status)
                    if (next) void moveToStage(item, next)
                  }}
                />
              )
            })}
          </div>
        </div>

        <DragOverlay>
          {activeItem && (
            <div className="rounded-xl border border-orbit-400/50 bg-[#171a33]/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3 cursor-grabbing rotate-1 scale-[1.02] shadow-[0_16px_48px_-8px_rgba(99,102,241,0.55)]">
              <RowBody item={activeItem} dimmed={false} app={activeApp} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
