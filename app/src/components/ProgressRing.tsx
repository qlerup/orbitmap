'use client'

import { useEffect, useState } from 'react'

interface Props {
  percent: number
}

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ProgressRing({ percent }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const clamped = Math.max(0, Math.min(100, percent))
  const offset = mounted ? CIRCUMFERENCE * (1 - clamped / 100) : CIRCUMFERENCE

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="55%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="ring-progress"
          style={{ filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.6))' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-white tabular-nums">{clamped}%</span>
      </div>
    </div>
  )
}
