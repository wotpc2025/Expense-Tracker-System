"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "dashboard-date-filter-v1"
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
  }, [dateFilterMode, selectedMonth, startDate, endDate, isHydrated])

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
