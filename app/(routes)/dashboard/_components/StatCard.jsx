"use client"

import React, { useEffect, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'

const toneStyles = {
  amber: 'border-amber-100 bg-amber-50/70',
  slate: 'border-slate-200 bg-slate-50',
  emerald: 'border-emerald-100 bg-emerald-50/70',
  white: 'border-slate-200 bg-white',
}

function Sparkline({ points }) {
  const safePoints = Array.isArray(points) && points.length > 1 ? points : [0, 0, 0, 0]
  const width = 96
  const height = 28
  const padding = 2
  const max = Math.max(...safePoints, 1)
  const min = Math.min(...safePoints, 0)
  const range = Math.max(max - min, 1)

  const mapped = safePoints.map((value, index) => {
    const x = (index / (safePoints.length - 1)) * (width - padding * 2) + padding
    const y = height - ((value - min) / range) * (height - padding * 2) - padding
    return `${x},${y}`
  })

  const first = Number(safePoints[0] || 0)
  const last = Number(safePoints[safePoints.length - 1] || 0)
  const trendColor = last > first ? '#059669' : last < first ? '#d97706' : '#64748b'

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className='opacity-90'>
      <polyline
        fill='none'
        stroke={trendColor}
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='sparkline-line'
        points={mapped.join(' ')}
      />
    </svg>
  )
}

function StatCard({ title, value, caption, formula = '', tone = 'slate', points = [], loading = false }) {
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (!tooltipOpen) return

    const onOutsidePress = (event) => {
      if (!tooltipRef.current?.contains(event.target)) {
        setTooltipOpen(false)
      }
    }

    document.addEventListener('mousedown', onOutsidePress)
    document.addEventListener('touchstart', onOutsidePress)

    return () => {
      document.removeEventListener('mousedown', onOutsidePress)
      document.removeEventListener('touchstart', onOutsidePress)
    }
  }, [tooltipOpen])

  return (
    <div className={`rounded-xl border p-3 ${toneStyles[tone] || toneStyles.slate}`}>
      {loading ? (
        <>
          <div className='h-3 w-20 animate-pulse rounded bg-slate-200' />
          <div className='mt-2 h-7 w-28 animate-pulse rounded bg-slate-200' />
          <div className='mt-2 h-6 w-24 animate-pulse rounded bg-slate-200' />
        </>
      ) : (
        <>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-600'>{title}</p>
            {formula && (
              <div className='group/tooltip relative' ref={tooltipRef}>
                <button
                  type='button'
                  onClick={() => setTooltipOpen((prev) => !prev)}
                  className='inline-flex cursor-help rounded text-slate-400 hover:text-slate-600'
                  aria-label='Show formula information'
                >
                  <CircleHelp className='h-3.5 w-3.5' />
                </button>
                <div className={`absolute right-0 z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white p-2 text-[11px] font-medium text-slate-600 shadow-lg transition-all ${tooltipOpen ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0'} md:group-hover/tooltip:visible md:group-hover/tooltip:opacity-100`}>
                  {formula}
                </div>
              </div>
            )}
          </div>
          <p className='mt-1 text-xl font-bold text-slate-800'>{value}</p>
          <div className='mt-2 flex items-end justify-between gap-2 text-slate-500'>
            <span className='text-[11px] font-medium'>{caption}</span>
            <Sparkline points={points} />
          </div>
        </>
      )}
    </div>
  )
}

export default StatCard
