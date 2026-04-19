"use client"
/**
 * useDashboardDateFilter.js — Shared Date Filter Hook
 *
 * Manages the active date filter state used across Dashboard, BudgetList,
 * and ExpensesPage so all three views stay in sync.
 *
 * Supported filter modes:
 *   - 'month' : single calendar month (YYYY-MM string)
 *   - 'range' : explicit start/end date pair (YYYY-MM-DD strings)
 *   - 'all'   : no date restriction
 *
 * State is persisted to localStorage (key: dashboard-date-filter-v1) so the
 * selected filter survives page refreshes.
 *
 * Cross-tab/cross-component sync is achieved via:
 *   1. The native 'storage' event   — fires when ANOTHER tab writes the key
 *   2. A custom 'dashboard-date-filter-sync' event — fires when the SAME tab
 *      updates state (the storage event does NOT fire in the originating tab)
 */
import { useEffect, useState } from "react"

const STORAGE_KEY = "dashboard-date-filter-v1"
const SYNC_EVENT = "dashboard-date-filter-sync"
const VALID_MODES = new Set(["month", "range", "all"])

function readStoredFilter() {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const dateFilterMode = VALID_MODES.has(parsed?.dateFilterMode) ? parsed.dateFilterMode : "month"
    const selectedMonth = typeof parsed?.selectedMonth === "string" ? parsed.selectedMonth : ""
    const startDate = typeof parsed?.startDate === "string" ? parsed.startDate : ""
    const endDate = typeof parsed?.endDate === "string" ? parsed.endDate : ""

    return { dateFilterMode, selectedMonth, startDate, endDate }
  } catch {
    return null
  }
}

export function useDashboardDateFilter(defaultMonth) {
  const [dateFilterMode, setDateFilterMode] = useState("month")
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const stored = readStoredFilter()
    if (stored) {
      setDateFilterMode(stored.dateFilterMode)
      if (stored.selectedMonth) setSelectedMonth(stored.selectedMonth)
      setStartDate(stored.startDate)
      setEndDate(stored.endDate)
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return

    const payload = {
      dateFilterMode,
      selectedMonth,
      startDate,
      endDate,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: payload }))
  }, [dateFilterMode, selectedMonth, startDate, endDate, isHydrated])

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return

    const applyPayload = (payload) => {
      if (!payload) return
      if (VALID_MODES.has(payload.dateFilterMode)) setDateFilterMode(payload.dateFilterMode)
      if (typeof payload.selectedMonth === "string" && payload.selectedMonth) setSelectedMonth(payload.selectedMonth)
      setStartDate(typeof payload.startDate === "string" ? payload.startDate : "")
      setEndDate(typeof payload.endDate === "string" ? payload.endDate : "")
    }

    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        applyPayload(JSON.parse(event.newValue))
      } catch {
        // Ignore malformed storage payloads.
      }
    }

    const onSync = (event) => {
      applyPayload(event?.detail)
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(SYNC_EVENT, onSync)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(SYNC_EVENT, onSync)
    }
  }, [isHydrated])

  return {
    dateFilterMode,
    setDateFilterMode,
    selectedMonth,
    setSelectedMonth,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  }
}
