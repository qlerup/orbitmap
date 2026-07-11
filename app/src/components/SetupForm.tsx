'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function passwordScore(password: string): number {
  let score = 0
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[A-ZÆØÅ]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9æøåÆØÅ]/.test(password)) score++
  return score
}

const SCORE_LABELS = ['Meget svag', 'Svag', 'Okay', 'God', 'Stærk', 'Meget stærk']
const SCORE_COLORS = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-500', 'bg-green-600']

export default function SetupForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const score = passwordScore(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Adgangskoderne stemmer ikke overens')
      return
    }
    if (password.length < 12) {
      setError('Adgangskoden skal være mindst 12 tegn')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'Opsætning er allerede gennemført') {
          router.push('/login')
          return
        }
        setError(data.error ?? 'Noget gik galt')
        return
      }
      router.push('/login?setup=done')
    } catch {
      setError('Netværksfejl – prøv igen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="alert-error">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Brugernavn</label>
        <input
          type="text"
          required
          autoFocus
          autoComplete="username"
          className="input-field"
          placeholder="fx christian"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Adgangskode</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            className="input-field pr-11"
            placeholder="Mindst 12 tegn"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {password.length > 0 && (
          <div className="mt-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? SCORE_COLORS[score] : 'bg-white/10'}`} />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">{SCORE_LABELS[score]}</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Gentag adgangskode</label>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          className="input-field"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        {confirmPassword.length > 0 && confirmPassword !== password && (
          <p className="text-xs text-red-500 mt-1">Adgangskoderne stemmer ikke overens</p>
        )}
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Opretter...' : 'Opret konto'}
      </button>
    </form>
  )
}
