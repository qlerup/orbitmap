'use client'

import { useState } from 'react'
import { APP_COLORS } from '@/lib/types'
import type { TrackedApp } from '@/lib/types'

interface Props {
  app: TrackedApp
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}

export default function EditAppModal({ app, onClose, onSaved, onDeleted }: Props) {
  const [name, setName] = useState(app.name)
  const [description, setDescription] = useState(app.description ?? '')
  const [color, setColor] = useState(APP_COLORS.includes(app.color) ? app.color : APP_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Kunne ikke gemme'); return }
      onSaved()
    } catch {
      setError('Netværksfejl – prøv igen')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/apps/${app.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Kunne ikke slette appen')
        return
      }
      onDeleted()
    } catch {
      setError('Netværksfejl – prøv igen')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-pop relative glass w-full max-w-sm p-6 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] bg-[#11142b]/90">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-bold text-white text-base">Rediger app</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors p-1 -m-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-5">Ret navn, beskrivelse eller farve</p>

        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="alert-error">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Navn</label>
            <input
              type="text"
              required
              autoFocus
              maxLength={100}
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Beskrivelse <span className="text-slate-500 font-normal">(valgfrit)</span>
            </label>
            <textarea
              rows={2}
              className="input-field resize-none"
              placeholder="Hvad gør appen?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Farve</label>
            <div className="flex flex-wrap gap-2.5">
              {APP_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all duration-150 ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-white/80 ring-offset-[#11142b] scale-110'
                      : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 16px ${c}99` : undefined }}
                  aria-label={`Vælg farve ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Annuller
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="btn-primary flex-1 !py-2.5 text-sm"
            >
              {saving ? 'Gemmer...' : 'Gem'}
            </button>
          </div>

          <div className="pt-2 border-t border-white/10">
            {confirmDelete ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">Slet appen og alle dens punkter?</span>
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
                Slet app
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
