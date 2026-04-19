"use client"
/**
 * useDashboardDensity.js — UI Density Preference Hook
 *
 * Persists the user's chosen layout density to localStorage and exposes
 * it throughout the dashboard (BudgetList, ExpensesListTable, StatCard, etc.).
 *
 * Density modes:
 *   - 'comfortable' : standard spacing (default)
 *   - 'compact'     : reduced padding, smaller text for data-dense views
 *   - 'auto'        : compact below 1280 px screen width, comfortable above
 *
 * Returns: [density, setDensity, resolvedDensity, resetDensity]
 *   - density         : the raw stored value ('auto' for auto mode)
 *   - resolvedDensity : the concrete value after applying 'auto' breakpoint logic
 *   - resetDensity    : convenience function that resets to the `fallback` value
 */
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
