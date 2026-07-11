'use client'

import { useState } from 'react'
import { STATUS_ORDER, STATUS_LABELS, TYPE_LABELS, PRIORITY_LABELS } from '@/lib/types'
import type { RoadmapItem, ItemType, ItemStatus, ItemPriority } from '@/lib/types'

interface Props {
  item: RoadmapItem
  onClose: () => void
  onUpdated: (item: RoadmapItem) => void
  onDeleted: (id: string) => void
}

const TYPES: ItemType[] = ['idea', 'bug', 'feature']
const PRIORITIES: ItemPriority[] = ['low', 'medium', 'high']

export default function ItemEditModal({ item, onClose, onUpdated, onDeleted }: Props) {
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? '')
  const [type, setType] = useState<ItemType>(item.type)
  const [status, setStatus] = useState<ItemStatus>(item.status)
  const [priority, setPriority] = useState<ItemPriority>(item.priority)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, type, status, priority }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Kunne ikke gemme'); return }
      onUpdated(data)
    } catch {
      setError('Netværksfejl – prøv igen')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted(item.id)
    } finally {
      setDeleting(false)
    }
  }

  const segmentClass = (active: boolean) =>
    `flex-1 py-2 rounded-xl border text-sm font-medium transition-all duration-150 ${
      active
        ? 'border-orbit-400/70 bg-orbit-500/15 text-orbit-200 shadow-[0_0_16px_-4px_rgba(129,140,248,0.5)]'
        : 'border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-pop relative glass w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] bg-[#11142b]/90">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-bold text-white text-base">Rediger punkt</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors p-1 -m-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="alert-error">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Titel</label>
            <input
              type="text"
              required
              maxLength={255}
              className="input-field"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Beskrivelse <span className="text-slate-500 font-normal">(valgfrit)</span>
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button key={t} type="button" onClick={() => setType(t)} className={segmentClass(type === t)}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prioritet</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p} type="button" onClick={() => setPriority(p)} className={segmentClass(priority === p)}>
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_ORDER.map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)} className={segmentClass(status === s)}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Annuller
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="btn-primary flex-1 !py-2.5 text-sm"
            >
              {saving ? 'Gemmer...' : 'Gem'}
            </button>
          </div>

          <div className="pt-2 border-t border-white/10">
            {confirmDelete ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">Slet punktet permanent?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shadow-[0_0_16px_-4px_rgba(239,68,68,0.6)]"
                  >
                    {deleting ? 'Sletter...' : 'Ja, slet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1.5 transition-colors"
                  >
                    Annuller
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Slet punkt
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
