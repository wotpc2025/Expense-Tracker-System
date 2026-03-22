"use client"

import { useEffect, useState } from 'react'

export function useDashboardDensity(storageKey = 'dashboard-density', fallback = 'comfortable') {
  const [density, setDensity] = useState(fallback)
  const [resolvedDensity, setResolvedDensity] = useState(fallback)

  const resetDensity = () => setDensity(fallback)

  useEffect(() => {
    try {
      const savedDensity = window.localStorage.getItem(storageKey)
      if (savedDensity === 'compact' || savedDensity === 'comfortable' || savedDensity === 'auto') {
        setDensity(savedDensity)
      }
    } catch {
      setDensity(fallback)
    }
  }, [fallback, storageKey])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1280px)')

    const applyDensity = () => {
      if (density === 'auto') {
        setResolvedDensity(mediaQuery.matches ? 'compact' : 'comfortable')
        return
      }

      setResolvedDensity(density)
    }

    applyDensity()
    mediaQuery.addEventListener('change', applyDensity)

    return () => mediaQuery.removeEventListener('change', applyDensity)
  }, [density])

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, density)
    } catch {
      // Ignore storage failures in restricted environments.
    }
  }, [density, storageKey])

  return [density, setDensity, resolvedDensity, resetDensity]
}
