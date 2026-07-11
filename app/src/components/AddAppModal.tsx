'use client'

import { useState } from 'react'
import { APP_COLORS } from '@/lib/types'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function AddAppModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(APP_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Kunne ikke oprette appen'); return }
      onCreated()
    } catch {
      setError('Netværksfejl – prøv igen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-pop relative glass w-full max-w-sm p-6 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] bg-[#11142b]/90">
        <h2 className="font-bold text-white text-base mb-1">Tilføj app</h2>
        <p className="text-sm text-slate-400 mb-5">Et projekt du vil holde roadmap over</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="alert-error">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Navn</label>
            <input
              type="text"
              required
              autoFocus
              maxLength={100}
              className="input-field"
              placeholder="fx FjordParcel"
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
              {saving ? 'Opretter...' : 'Opret app'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
