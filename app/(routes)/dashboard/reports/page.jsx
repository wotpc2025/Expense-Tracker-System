"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { getBudgetListAction, getAllExpensesAction } from '@/app/_actions/dbActions'
import { getTranslation } from '@/lib/translations'
import { useDashboardDateFilter } from '@/lib/useDashboardDateFilter'
import { getCategoryColor } from '@/lib/expenseCategories'
import { EXPORT_LANGUAGE_OPTIONS, exportRowsToCsv, sanitizeFileNamePart } from '@/lib/csvExport'
import moment from 'moment'
import 'moment/locale/th'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Wallet, Receipt, CalendarDays, Tag, TrendingUp, TrendingDown, ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

moment.locale('th')

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6']

const fmt = (val) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(val)

const CustomTooltipStyle = (isDark) => ({
  backgroundColor: isDark ? '#1e293b' : '#fff',
  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
  borderRadius: 10,
  color: isDark ? '#e2e8f0' : '#1e293b',
  fontSize: 12,
})

const formatCurrencyForLanguage = (value, locale) => {
  const amount = Number(value || 0)
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function ReportsPage() {
  const { user } = useUser()
  const { resolvedTheme } = useTheme()
  const language = 'en';const isDark = resolvedTheme === 'dark'

  const [budgetList, setBudgetList] = useState([])
  const [expensesList, setExpensesList] = useState([])
  const [loading, setLoading] = useState(true)
  const {
    dateFilterMode,
    setDateFilterMode,
    selectedMonth,
    setSelectedMonth,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = useDashboardDateFilter(moment().format('YYYY-MM'))
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false)
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false)

  const [sortKey, setSortKey] = useState('pct')
  const [sortDir, setSortDir] = useState('desc')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef(null)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress
    if (email) fetchData(email)
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async (email) => {
    setLoading(true)
    const [budgets, expenses] = await Promise.all([
      getBudgetListAction(email),
      getAllExpensesAction(email),
    ])
    setBudgetList(budgets || [])
    setExpensesList(expenses || [])
    setLoading(false)
  }

  const exportBudgetPerformanceCSV = (selectedLanguage) => {
    const languageConfig = EXPORT_LANGUAGE_OPTIONS[selectedLanguage] || EXPORT_LANGUAGE_OPTIONS.th
    const headers = selectedLanguage === 'th'
      ? {
        name: 'งบประมาณ',
        amount: 'จำนวนงบประมาณ',
        spent: 'ใช้จ่ายจริง',
        remaining: 'คงเหลือ',
        ratio: 'อัตราการใช้ (%)',
      }
      : {
        name: 'Budget',
        amount: 'Budget Amount',
        spent: getTranslation(language, 'reports.actualSpent'),
        remaining: getTranslation(language, 'reports.remaining'),
        ratio: 'Usage Ratio (%)',
      }

    const rows = sortedBudgetList.map((b) => {
      const budget = Number(b.amount)
      const spent = Number(b.totalSpend || 0)
      const remaining = budget - spent
      const ratio = budget > 0 ? (spent / budget) * 100 : 0

      return {
        name: b.name || '',
        amount: budget,
        spent,
        remaining,
        ratio,
      }
    })

    const totals = rows.reduce((acc, row) => {
      acc.amount += Number(row.amount || 0)
      acc.spent += Number(row.spent || 0)
      acc.remaining += Number(row.remaining || 0)
      return acc
    }, { amount: 0, spent: 0, remaining: 0 })
    const totalRatio = totals.amount > 0 ? (totals.spent / totals.amount) * 100 : 0

    const rowsWithTotal = [
      ...rows,
      {
        name: selectedLanguage === 'th' ? 'รวมทั้งหมด' : 'Total',
        amount: totals.amount,
        spent: totals.spent,
        remaining: totals.remaining,
        ratio: totalRatio,
      },
    ]

    const userName = sanitizeFileNamePart(user?.fullName || 'user')
    const userEmail = sanitizeFileNamePart(user?.primaryEmailAddress?.emailAddress || 'no-email')

    exportRowsToCsv({
      rows: rowsWithTotal,
      columns: [
        { key: 'name', header: headers.name },
        { key: 'amount', header: headers.amount, formatter: (value) => formatCurrencyForLanguage(value, languageConfig.locale) },
        { key: 'spent', header: headers.spent, formatter: (value) => formatCurrencyForLanguage(value, languageConfig.locale) },
        { key: 'remaining', header: headers.remaining, formatter: (value) => formatCurrencyForLanguage(value, languageConfig.locale) },
        { key: 'ratio', header: headers.ratio, formatter: (value) => `${Number(value || 0).toFixed(2)}%` },
      ],
      fileName: `reports-budget-performance-${userName}-${userEmail}-${selectedLanguage}-${moment().format('YYYY-MM-DD')}.csv`,
    })

    setShowExportMenu(false)
  }

  const exportBudgetPerformancePDF = async (selectedLanguage) => {
    const formatPdfCurrency = (value) => {
      const amount = Number(value || 0)
      return `THB ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const arrayBufferToBase64 = (buffer) => {
      const bytes = new Uint8Array(buffer)
      const chunkSize = 0x8000
      let binary = ''
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
      }
      return btoa(binary)
    }

    const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

    const ensureThaiFont = async (doc) => {
      if (doc.__thaiFontReady) return
      const response = await fetch('/fonts/NotoSansThai-Regular.ttf')
      if (!response.ok) throw new Error('Cannot load Thai font file')
      const fontBuffer = await response.arrayBuffer()
      const fontBase64 = arrayBufferToBase64(fontBuffer)
      doc.addFileToVFS('NotoSansThai-Regular.ttf', fontBase64)
      doc.addFont('NotoSansThai-Regular.ttf', 'NotoSansThai', 'normal')
      doc.__thaiFontReady = true
    }

    const loadLogoDataUrl = async () => {
      const response = await fetch('/logo-exfinit.png')
      if (!response.ok) throw new Error('Cannot load logo image')
      const blob = await response.blob()
      return blobToDataUrl(blob)
    }

    const userName = sanitizeFileNamePart(user?.fullName || 'user')
    const userEmail = sanitizeFileNamePart(user?.primaryEmailAddress?.emailAddress || 'no-email')
    const generatedDate = moment().format('YYYY-MM-DD HH:mm')
    const fileName = `reports-budget-performance-${userName}-${userEmail}-${selectedLanguage}-${moment().format('YYYY-MM-DD')}.pdf`

    const rawRows = sortedBudgetList.map((b) => {
      const budget = Number(b.amount)
      const spent = Number(b.totalSpend || 0)
      const remaining = budget - spent
      const ratio = budget > 0 ? (spent / budget) * 100 : 0
      return { name: b.name || '', budget, spent, remaining, ratio }
    })

    const totals = rawRows.reduce((acc, row) => {
      acc.budget += Number(row.budget || 0)
      acc.spent += Number(row.spent || 0)
      acc.remaining += Number(row.remaining || 0)
      return acc
    }, { budget: 0, spent: 0, remaining: 0 })
    const totalRatio = totals.budget > 0 ? (totals.spent / totals.budget) * 100 : 0
    const summaryRow = {
      name: selectedLanguage === 'th' ? 'รวมทั้งหมด' : 'Total',
      budget: totals.budget,
      spent: totals.spent,
      remaining: totals.remaining,
      ratio: totalRatio,
    }

    const columnsTH = [
      { key: 'name', label: 'งบประมาณ', x: 40, width: 250, align: 'left', render: (row) => row.name },
      { key: 'budget', label: 'จำนวนงบประมาณ', x: 290, width: 140, align: 'right', render: (row) => formatPdfCurrency(row.budget) },
      { key: 'spent', label: 'ใช้จ่ายจริง', x: 430, width: 140, align: 'right', render: (row) => formatPdfCurrency(row.spent) },
      { key: 'remaining', label: 'คงเหลือ', x: 570, width: 140, align: 'right', render: (row) => formatPdfCurrency(row.remaining) },
      { key: 'ratio', label: 'อัตราการใช้ร้อยละ', x: 710, width: 140, align: 'right', render: (row) => `${row.ratio.toFixed(2)}%` },
    ]

    const columnsEN = [
      { key: 'name', label: 'Budget', render: (row) => row.name },
      { key: 'budget', label: 'Budget Amount', render: (row) => formatPdfCurrency(row.budget) },
      { key: 'spent', label: getTranslation(language, 'reports.actualSpent'), render: (row) => formatPdfCurrency(row.spent) },
      { key: 'remaining', label: getTranslation(language, 'reports.remaining'), render: (row) => formatPdfCurrency(row.remaining) },
      { key: 'ratio', label: 'Usage Ratio (%)', render: (row) => `${row.ratio.toFixed(2)}%` },
    ]

    const logoDataUrl = await loadLogoDataUrl().catch(() => null)
    const logoX = 40
    const logoY = 26
    const logoWidth = 64
    const logoHeight = 24
    const headerTextX = logoDataUrl ? logoX + logoWidth + 12 : 72

    if (selectedLanguage === 'th') {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      await ensureThaiFont(doc)

      const isThaiText = (value) => /[\u0E00-\u0E7F]/.test(String(value || ''))
      const setFontByText = (value, size) => {
        if (isThaiText(value)) doc.setFont('NotoSansThai', 'normal')
        else doc.setFont('helvetica', 'normal')
        if (size) doc.setFontSize(size)
      }

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight)
      } else {
        doc.setFillColor(15, 23, 42)
        doc.roundedRect(40, 28, 24, 24, 4, 4, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.text('ETS', 46, 43)
      }

      doc.setFont('NotoSansThai', 'normal')
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(16)
      doc.text('รายงานประสิทธิภาพงบประมาณ', headerTextX, 40)
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      doc.text('วันที่สร้าง:', headerTextX, 58)
      doc.setFont('helvetica', 'normal')
      doc.text(generatedDate, headerTextX + 50, 58)
      doc.setFont('NotoSansThai', 'normal')
      doc.text('งบประมาณ:', 300, 58)
      doc.setFont('helvetica', 'normal')
      doc.text(String(rawRows.length), 350, 58)

      const drawHeader = (y) => {
        doc.setFillColor(30, 41, 59)
        doc.rect(40, y, 810, 22, 'F')
        doc.setTextColor(255, 255, 255)
        columnsTH.forEach((col) => {
          setFontByText(col.label, 10)
          if (col.align === 'right') {
            const w = doc.getTextWidth(col.label)
            doc.text(col.label, col.x + col.width - 8 - w, y + 15)
          } else {
            doc.text(col.label, col.x + 8, y + 15)
          }
        })
      }

      let y = 80
      drawHeader(y)
      y += 22

      rawRows.forEach((row, index) => {
        const rowHeight = 22
        const pageBottomLimit = doc.internal.pageSize.getHeight() - 30
        if (y + rowHeight > pageBottomLimit) {
          doc.addPage()
          y = 40
          drawHeader(y)
          y += 22
        }

        doc.setFillColor(index % 2 === 0 ? 248 : 241, index % 2 === 0 ? 250 : 245, index % 2 === 0 ? 252 : 249)
        doc.rect(40, y, 810, rowHeight, 'F')
        doc.setTextColor(31, 41, 55)

        columnsTH.forEach((col) => {
          const value = col.render(row)
          setFontByText(value, 9.5)
          if (col.align === 'right') {
            const textWidth = doc.getTextWidth(value)
            doc.text(value, col.x + col.width - 8 - textWidth, y + 15)
          } else {
            doc.text(value, col.x + 8, y + 15, { maxWidth: col.width - 16 })
          }
        })

        y += rowHeight
      })

      const summaryRowHeight = 24
      const pageBottomLimit = doc.internal.pageSize.getHeight() - 30
      if (y + summaryRowHeight > pageBottomLimit) {
        doc.addPage()
        y = 40
        drawHeader(y)
        y += 22
      }

      doc.setFillColor(30, 41, 59)
      doc.rect(40, y, 810, summaryRowHeight, 'F')
      doc.setTextColor(255, 255, 255)

      columnsTH.forEach((col) => {
        const value = col.render(summaryRow)
        setFontByText(value, 10)
        if (col.align === 'right') {
          const textWidth = doc.getTextWidth(value)
          doc.text(value, col.x + col.width - 8 - textWidth, y + 16)
        } else {
          doc.text(value, col.x + 8, y + 16, { maxWidth: col.width - 16 })
        }
      })

      const pageHeight = doc.internal.pageSize.height
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`Expense Tracker System - ${user?.primaryEmailAddress?.emailAddress || 'N/A'}`, 40, pageHeight - 20)
      doc.save(fileName)
      setShowExportMenu(false)
      return
    }

    const enRows = rawRows.map((row) => columnsEN.map((col) => col.render(row)))
    const enSummaryRow = columnsEN.map((col) => col.render(summaryRow))
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight)
    } else {
      doc.setFillColor(15, 23, 42)
      doc.roundedRect(40, 28, 24, 24, 4, 4, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.text('ETS', 46, 43)
    }

    doc.setTextColor(17, 24, 39)
    doc.setFontSize(16)
    doc.text('Budget Performance Report', headerTextX, 40)
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(`Generated: ${generatedDate}`, headerTextX, 58)
    doc.text(`Budgets: ${rawRows.length}`, 290, 58)

    autoTable(doc, {
      head: [columnsEN.map((col) => col.label)],
      body: enRows,
      foot: [enSummaryRow],
      showFoot: 'lastPage',
      startY: 72,
      styles: {
        font: 'helvetica',
        fontStyle: 'normal',
        fontSize: 8.5,
        cellPadding: 4.5,
        textColor: [31, 41, 55],
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        font: 'helvetica',
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      footStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        font: 'helvetica',
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 180 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      didDrawPage: () => {
        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(`Expense Tracker System - ${user?.primaryEmailAddress?.emailAddress || 'N/A'}`, 40, pageHeight - 20)
      },
    })

    doc.save(fileName)
    setShowExportMenu(false)
  }

  // ── Date parsing helper ──────────────────────────────────────────────────────

  const parseDate = (dateStr) => {
    if (!dateStr) return null
    const formats = ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'YYYY/MM/DD', 'DD-MM-YYYY']
    for (const fmt of formats) {
      const m = moment(dateStr, fmt, true)
      if (m.isValid()) return m
    }
    const m = moment(dateStr)
    return m.isValid() ? m : null
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filteredExpenses = useMemo(() => {
    if (dateFilterMode === 'all') return expensesList

    if (dateFilterMode === 'month') {
      return expensesList.filter((e) => {
        const parsed = parseDate(e.createdAt)
        return parsed && parsed.format('YYYY-MM') === selectedMonth
      })
    }

    const from = startDate ? moment(startDate, 'YYYY-MM-DD', true).startOf('day') : null
    const to = endDate ? moment(endDate, 'YYYY-MM-DD', true).endOf('day') : null

    return expensesList.filter((e) => {
      const m = parseDate(e.createdAt)
      if (!m) return false
      if (from && m.isBefore(from)) return false
      if (to && m.isAfter(to)) return false
      return true
    })
  }, [expensesList, dateFilterMode, selectedMonth, startDate, endDate])

  const budgetSpendById = useMemo(() => {
    const map = {}
    filteredExpenses.forEach((expense) => {
      const budgetId = Number(expense?.budgetId)
      if (!budgetId) return
      map[budgetId] = (map[budgetId] || 0) + Number(expense?.amount || 0)
    })
    return map
  }, [filteredExpenses])

  const activeBudgetIds = useMemo(() => {
    return new Set(
      filteredExpenses
        .map((expense) => Number(expense?.budgetId))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  }, [filteredExpenses])

  const filteredBudgetList = useMemo(() => {
    const baseBudgets = dateFilterMode === 'all'
      ? budgetList
      : budgetList.filter((budget) => activeBudgetIds.has(Number(budget.id)))

    return baseBudgets.map((budget) => ({
      ...budget,
      totalSpend: Number(budgetSpendById[budget.id] || 0),
    }))
  }, [budgetList, budgetSpendById, activeBudgetIds, dateFilterMode])

  const sortedBudgetList = useMemo(() => {
    const getValue = (b) => {
      const budget = Number(b.amount)
      const spent = Number(b.totalSpend || 0)
      switch (sortKey) {
        case 'name':      return b.name?.toLowerCase() || ''
        case 'category':  return (b.category || 'uncategorized').toLowerCase()
        case 'amount':    return budget
        case 'spent':     return spent
        case 'remaining': return budget - spent
        case 'pct':       return budget > 0 ? (spent / budget) * 100 : 0
        default:          return 0
      }
    }

    return [...filteredBudgetList].sort((a, b) => {
      const av = getValue(a)
      const bv = getValue(b)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredBudgetList, sortKey, sortDir])

  const periodLabel = (() => {
    if (dateFilterMode === 'all') return language === 'th' ? 'ทุกช่วงเวลา' : 'All time'

    if (dateFilterMode === 'month') {
      return moment(selectedMonth, 'YYYY-MM', true)
        .locale(language === 'th' ? 'th' : 'en')
        .format('MMMM YYYY')
    }

    if (!startDate && !endDate) return language === 'th' ? 'ช่วงวันที่ทั้งหมด' : 'Any date range'
    if (startDate && endDate) {
      const from = moment(startDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
      const to = moment(endDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
      return `${from} - ${to}`
    }
    if (startDate) {
      const from = moment(startDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
      return `${language === 'th' ? 'ตั้งแต่' : 'From'} ${from}`
    }
    const to = moment(endDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
    return `${language === 'th' ? 'ถึง' : 'Until'} ${to}`
  })()

  const periodTotal = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const overallTotal = expensesList.reduce((s, e) => s + Number(e.amount || 0), 0)

  const periodDays = useMemo(() => {
    if (dateFilterMode === 'month') {
      const selected = moment(selectedMonth, 'YYYY-MM', true)
      const nowKey = moment().format('YYYY-MM')
      return selectedMonth === nowKey ? moment().date() : selected.daysInMonth()
    }

    if (dateFilterMode === 'range') {
      if (startDate && endDate) {
        const from = moment(startDate, 'YYYY-MM-DD', true)
        const to = moment(endDate, 'YYYY-MM-DD', true)
        return Math.max(to.diff(from, 'days') + 1, 1)
      }
      const uniqueDays = new Set(
        filteredExpenses
          .map((e) => parseDate(e.createdAt))
          .filter(Boolean)
          .map((d) => d.format('YYYY-MM-DD'))
      )
      return Math.max(uniqueDays.size, 1)
    }

    const uniqueDays = new Set(
      filteredExpenses
        .map((e) => parseDate(e.createdAt))
        .filter(Boolean)
        .map((d) => d.format('YYYY-MM-DD'))
    )
    return Math.max(uniqueDays.size, 1)
  }, [dateFilterMode, selectedMonth, startDate, endDate, filteredExpenses])

  const avgPerDay = periodDays > 0 ? periodTotal / periodDays : 0

  const previousPeriodTotal = useMemo(() => {
    if (dateFilterMode === 'month') {
      const prevMonthKey = moment(selectedMonth, 'YYYY-MM', true).subtract(1, 'month').format('YYYY-MM')
      return expensesList
        .filter((e) => {
          const parsed = parseDate(e.createdAt)
          return parsed && parsed.format('YYYY-MM') === prevMonthKey
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0)
    }

    if (dateFilterMode === 'range' && startDate && endDate) {
      const from = moment(startDate, 'YYYY-MM-DD', true).startOf('day')
      const to = moment(endDate, 'YYYY-MM-DD', true).endOf('day')
      const spanDays = Math.max(to.diff(from, 'days') + 1, 1)
      const prevTo = from.clone().subtract(1, 'day').endOf('day')
      const prevFrom = prevTo.clone().subtract(spanDays - 1, 'days').startOf('day')

      return expensesList
        .filter((e) => {
          const d = parseDate(e.createdAt)
          if (!d) return false
          return !d.isBefore(prevFrom) && !d.isAfter(prevTo)
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0)
    }

    return null
  }, [dateFilterMode, selectedMonth, startDate, endDate, expensesList])

  const periodChange = previousPeriodTotal && previousPeriodTotal > 0
    ? ((periodTotal - previousPeriodTotal) / previousPeriodTotal) * 100
    : null

  const getCategoryLabel = (categoryKey) => {
    const translated = getTranslation(language, `categories.${categoryKey}`)
    return translated === `categories.${categoryKey}` ? categoryKey : translated
  }

  const categoryTotals = {}
  filteredExpenses.forEach((e) => {
    const cat = e.category || 'uncategorized'
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0)
  })
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
  const categoryPieData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name: getCategoryLabel(name), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const trendBase = dateFilterMode === 'month'
    ? moment(selectedMonth, 'YYYY-MM', true)
    : (endDate ? moment(endDate, 'YYYY-MM-DD', true) : moment())

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const m = trendBase.clone().subtract(5 - i, 'months')
    const key = m.format('YYYY-MM')
    const spend = expensesList
      .filter((e) => {
        const parsed = parseDate(e.createdAt)
        return parsed && parsed.format('YYYY-MM') === key
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    const monthLabel = m.locale(language === 'en' ? 'en' : 'th').format('MMM YY')
    return { month: monthLabel, spend }
  })

  // Budget vs Actual (all budgets) - localized keys
  const budgetKey = getTranslation(language, 'reports.budget')
  const spentKey = getTranslation(language, 'reports.actualSpent')
  const budgetVsActual = filteredBudgetList.map(b => ({
    name: b.name.length > 11 ? b.name.slice(0, 10) + '…' : b.name,
    [budgetKey]: Number(b.amount),
    [spentKey]: Number(b.totalSpend || 0),
  }))

  // ── Chart style helpers ───────────────────────────────────────────────────────
  const gridStroke  = isDark ? '#334155' : '#e2e8f0'
  const axisColor   = isDark ? '#94a3b8' : '#64748b'
  const ttStyle     = CustomTooltipStyle(isDark)

  // ── KPI cards config ──────────────────────────────────────────────────────────
  const kpiCards = [
    {
      title: dateFilterMode === 'month' ? getTranslation(language, 'expensesStats.thisMonth') : (language === 'th' ? 'ยอดตามช่วงเวลา' : 'Period Total'),
      value: fmt(periodTotal),
      sub: periodChange !== null
        ? `${periodChange > 0 ? '▲' : '▼'} ${Math.abs(periodChange).toFixed(1)}% ${getTranslation(language, 'reports.fromLastMonth')}`
        : periodLabel,
      positive: periodChange !== null ? periodChange <= 0 : true,
      showTrend: periodChange !== null,
      Icon: Wallet,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/30',
    },
    {
      title: getTranslation(language, 'expensesStats.totalAmount'),
      value: fmt(overallTotal),
      sub: `${expensesList.length} ${getTranslation(language, 'reports.allTransactions')}`,
      Icon: Receipt,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      title: getTranslation(language, 'expensesStats.avgPerDay'),
      value: fmt(avgPerDay),
      sub: `${periodDays} ${language === 'th' ? 'วันในช่วงที่เลือก' : 'days in selected period'}`,
      Icon: CalendarDays,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    },
    {
      title: getTranslation(language, 'expensesStats.topCategory'),
      value: topCategory ? getCategoryLabel(topCategory[0]) : '—',
      sub: topCategory ? fmt(topCategory[1]) : getTranslation(language, 'reports.noExpenseData'),
      Icon: Tag,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
    },
  ]

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className='p-5 space-y-5'>
        <div className='h-8 w-52 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse' />
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse' />
          ))}
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='h-72 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse' />
          <div className='h-72 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse' />
        </div>
        <div className='h-72 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse' />
      </div>
    )
  }

  return (
    <div className='p-5 space-y-5'>

      {/* ── Header ── */}
      <div className='flex items-start justify-between gap-3 flex-wrap'>
        <div>
          <h2 className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
            {getTranslation(language, 'reports.title')}
          </h2>
          <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>
            {getTranslation(language, 'reports.subtitle')} — {periodLabel}
          </p>
        </div>
        <div className='relative' ref={exportMenuRef}>
          <Button
            type='button'
            variant='outline'
            onClick={() => setShowExportMenu((prev) => !prev)}
            className='h-10 cursor-pointer gap-2'
          >
            <Download className='h-4 w-4' />
            Export CSV/PDF
            <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </Button>
          {showExportMenu && (
            <div className='absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg z-20 p-1 dark:border-slate-700 dark:bg-slate-800'>
              <button
                type='button'
                onClick={() => exportBudgetPerformanceCSV('th')}
                className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer dark:hover:bg-slate-700'
              >
                Export CSV ไทย (TH)
              </button>
              <button
                type='button'
                onClick={() => exportBudgetPerformanceCSV('en')}
                className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer dark:hover:bg-slate-700'
              >
                Export CSV English (EN)
              </button>
              <div className='my-1 border-t border-slate-200 dark:border-slate-700' />
              <button
                type='button'
                onClick={() => exportBudgetPerformancePDF('th')}
                className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer dark:hover:bg-slate-700'
              >
                Export PDF ไทย (TH)
              </button>
              <button
                type='button'
                onClick={() => exportBudgetPerformancePDF('en')}
                className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer dark:hover:bg-slate-700'
              >
                Export PDF English (EN)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='w-full min-w-37.5 sm:w-auto'>
            <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
              {language === 'th' ? 'โหมดวันที่' : 'Date mode'}
            </label>
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value)}
              className='h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            >
              <option value='month'>{language === 'th' ? 'รายเดือน' : 'By month'}</option>
              <option value='range'>{language === 'th' ? 'ช่วงวันที่' : 'Date range'}</option>
              <option value='all'>{language === 'th' ? 'ทุกช่วงเวลา' : 'All time'}</option>
            </select>
          </div>

          {dateFilterMode === 'month' && (
            <div className='w-full min-w-37.5 sm:w-auto'>
              <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                {language === 'th' ? 'เลือกเดือน' : 'Select month'}
              </label>
              <Popover open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-10 w-full justify-between border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  >
                    <span>
                      {moment(`${selectedMonth}-01`, 'YYYY-MM-DD', true)
                        .locale(language === 'th' ? 'th' : 'en')
                        .format('MMMM YYYY')}
                    </span>
                    <CalendarDays className='h-4 w-4 opacity-70' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={moment(`${selectedMonth}-01`, 'YYYY-MM-DD', true).toDate()}
                    month={moment(`${selectedMonth}-01`, 'YYYY-MM-DD', true).toDate()}
                    captionLayout='dropdown'
                    fromYear={2018}
                    toYear={moment().year() + 2}
                    onMonthChange={(date) => {
                      setSelectedMonth(moment(date).format('YYYY-MM'))
                    }}
                    onSelect={(date) => {
                      if (!date) return
                      setSelectedMonth(moment(date).format('YYYY-MM'))
                      setIsMonthPickerOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {dateFilterMode === 'range' && (
            <>
              <div className='w-full min-w-37.5 sm:w-auto'>
                <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                  {language === 'th' ? 'จากวันที่' : 'From'}
                </label>
                <Popover open={isStartPickerOpen} onOpenChange={setIsStartPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-10 w-full justify-between border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    >
                      <span>
                        {startDate
                          ? moment(startDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
                          : (language === 'th' ? 'เลือกวันที่เริ่มต้น' : 'Select start date')}
                      </span>
                      <CalendarDays className='h-4 w-4 opacity-70' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={startDate ? moment(startDate, 'YYYY-MM-DD', true).toDate() : undefined}
                      captionLayout='dropdown'
                      fromYear={2000}
                      toYear={moment().year() + 2}
                      defaultMonth={startDate ? moment(startDate, 'YYYY-MM-DD', true).toDate() : moment().toDate()}
                      onSelect={(date) => {
                        if (!date) return
                        const next = moment(date).format('YYYY-MM-DD')
                        setStartDate(next)
                        if (endDate && moment(endDate).isBefore(moment(next))) {
                          setEndDate(next)
                        }
                        setIsStartPickerOpen(false)
                      }}
                      disabled={(date) => Boolean(endDate && moment(date).isAfter(moment(endDate, 'YYYY-MM-DD', true).toDate()))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='w-full min-w-37.5 sm:w-auto'>
                <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                  {language === 'th' ? 'ถึงวันที่' : 'To'}
                </label>
                <Popover open={isEndPickerOpen} onOpenChange={setIsEndPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-10 w-full justify-between border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    >
                      <span>
                        {endDate
                          ? moment(endDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
                          : (language === 'th' ? 'เลือกวันที่สิ้นสุด' : 'Select end date')}
                      </span>
                      <CalendarDays className='h-4 w-4 opacity-70' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={endDate ? moment(endDate, 'YYYY-MM-DD', true).toDate() : undefined}
                      captionLayout='dropdown'
                      fromYear={2000}
                      toYear={moment().year() + 2}
                      defaultMonth={endDate ? moment(endDate, 'YYYY-MM-DD', true).toDate() : (startDate ? moment(startDate, 'YYYY-MM-DD', true).toDate() : moment().toDate())}
                      onSelect={(date) => {
                        if (!date) return
                        const next = moment(date).format('YYYY-MM-DD')
                        setEndDate(next)
                        if (startDate && moment(startDate).isAfter(moment(next))) {
                          setStartDate(next)
                        }
                        setIsEndPickerOpen(false)
                      }}
                      disabled={(date) => Boolean(startDate && moment(date).isBefore(moment(startDate, 'YYYY-MM-DD', true).toDate()))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {kpiCards.map((card, i) => (
          <div key={i} className='border rounded-2xl p-5 bg-white dark:border-slate-700 dark:bg-slate-800'>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>{card.title}</p>
              <div className={`p-2 rounded-xl ${card.bg}`}>
                <card.Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className={`text-xl font-bold truncate ${card.color}`}>{card.value}</p>
            <div className='flex items-center gap-1 mt-1'>
              {card.showTrend && (
                card.positive
                  ? <TrendingDown className='h-3 w-3 text-emerald-500 shrink-0' />
                  : <TrendingUp className='h-3 w-3 text-red-500 shrink-0' />
              )}
              <p className={`text-xs truncate ${card.showTrend ? (card.positive ? 'text-emerald-500' : 'text-red-500') : 'text-slate-400 dark:text-slate-500'}`}>
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Monthly Trend + Category Pie ── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>

        {/* Monthly Line Chart */}
        <div className='border rounded-2xl p-5 bg-white dark:border-slate-700 dark:bg-slate-800'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200'>{getTranslation(language, 'reports.monthlyTrend')}</h3>
          <p className='text-xs text-slate-400 dark:text-slate-500 mb-4'>{getTranslation(language, 'reports.trendDesc')}</p>
          <ResponsiveContainer width='100%' height={220}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={gridStroke} />
              <XAxis dataKey='month' tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={v => v >= 1000 ? `฿${(v / 1000).toFixed(0)}K` : `฿${v}`}
              />
              <Tooltip
                formatter={(v) => [fmt(v), getTranslation(language, 'reports.actualSpent')]}
                contentStyle={ttStyle}
                cursor={{ stroke: isDark ? '#475569' : '#cbd5e1', strokeWidth: 1 }}
              />
              <Line
                type='monotone'
                dataKey='spend'
                stroke='#6366f1'
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Donut */}
        <div className='border rounded-2xl p-5 bg-white dark:border-slate-700 dark:bg-slate-800'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200'>{getTranslation(language, 'reports.byCategoryPie')}</h3>
          <p className='text-xs text-slate-400 dark:text-slate-500 mb-4'>{getTranslation(language, 'reports.byCategoryDesc')}</p>
          {categoryPieData.length > 0 ? (
            <ResponsiveContainer width='100%' height={220}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx='50%'
                  cy='50%'
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey='value'
                >
                  {categoryPieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke='none' />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [fmt(v), name]}
                  contentStyle={ttStyle}
                />
                <Legend
                  iconType='circle'
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: axisColor }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center h-55 text-slate-400 dark:text-slate-500 text-sm'>
              {getTranslation(language, 'reports.noExpenseData')}
            </div>
          )}
        </div>
      </div>

      {/* ── Budget vs Actual ── */}
      <div className='border rounded-2xl p-5 bg-white dark:border-slate-700 dark:bg-slate-800'>
        <h3 className='font-semibold text-slate-700 dark:text-slate-200'>{getTranslation(language, 'reports.budgetVsActual')}</h3>
        <p className='text-xs text-slate-400 dark:text-slate-500 mb-4'>
          {getTranslation(language, 'reports.budgetVsActualDesc')}
        </p>
        {budgetVsActual.length > 0 ? (
          <ResponsiveContainer width='100%' height={260}>
            <BarChart data={budgetVsActual} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={gridStroke} vertical={false} />
              <XAxis dataKey='name' tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={v => v >= 1000 ? `฿${(v / 1000).toFixed(0)}K` : `฿${v}`}
              />
              <Tooltip
                formatter={(v, name) => [fmt(v), name]}
                contentStyle={ttStyle}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
              <Bar dataKey={budgetKey} fill='#10b981' radius={[5, 5, 0, 0]} />
              <Bar dataKey={spentKey} fill='#6366f1' radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex items-center justify-center h-65 text-slate-400 dark:text-slate-500 text-sm'>
            {getTranslation(language, 'reports.noBudgetData')}
          </div>
        )}
      </div>

      {/* ── Budget Performance Table ── */}
      {filteredBudgetList.length > 0 && (
        <div className='border rounded-2xl p-5 bg-white dark:border-slate-700 dark:bg-slate-800'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200 mb-4'>{getTranslation(language, 'reports.budgetPerformance')}</h3>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b dark:border-slate-700'>
                  {[['name','left','reports.budgetName'],['category','left','reports.category'],['amount','right','reports.budgetAmount'],['spent','right','reports.actualSpent'],['remaining','right','reports.remaining'],['pct','left','reports.ratio']].map(([key, align, tKey]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`pb-3 font-medium select-none cursor-pointer group ${align === 'right' ? 'text-right pr-4' : 'text-left'} ${key === 'pct' ? 'w-36' : ''} ${sortKey === key ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'} transition-colors`}
                    >
                      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
                        {getTranslation(language, tKey)}
                        {sortKey === key
                          ? (sortDir === 'asc' ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />)
                          : <ChevronsUpDown className='h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity' />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedBudgetList.map((b) => {
                  const budget  = Number(b.amount)
                  const spent   = Number(b.totalSpend || 0)
                  const remain  = budget - spent
                  const pct     = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
                  const over    = spent > budget
                  return (
                    <tr key={b.id} className='border-b last:border-0 dark:border-slate-700/50'>
                      <td className='py-3 pr-4'>
                        <div className='flex items-center gap-2'>
                          <span className='text-lg'>{b.icon}</span>
                          <span className='font-medium text-slate-700 dark:text-slate-200 truncate max-w-35'>{b.name}</span>
                        </div>
                      </td>
                      <td className='py-3 pr-4'>
                        <span
                          style={{ backgroundColor: getCategoryColor(b.category || 'uncategorized'), color: '#fff' }}
                          className='inline-flex rounded-full px-2 py-0.5 text-xs font-semibold'
                        >
                          {getCategoryLabel(b.category || 'uncategorized')}
                        </span>
                      </td>
                      <td className='py-3 pr-4 text-right text-slate-600 dark:text-slate-300'>{fmt(budget)}</td>
                      <td className={`py-3 pr-4 text-right font-medium ${over ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                        {fmt(spent)}
                      </td>
                      <td className={`py-3 pr-4 text-right ${remain < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {fmt(remain)}
                      </td>
                      <td className='py-3'>
                        <div className='flex items-center gap-2'>
                          <div className='flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden'>
                            <div
                              className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : 'bg-indigo-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs w-9 text-right shrink-0 ${over ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredBudgetList.length === 0 && (
        <div className='border rounded-2xl p-5 bg-white dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center justify-center h-28 text-slate-400 dark:text-slate-500 text-sm'>
            {language === 'th' ? 'ไม่พบข้อมูลงบประมาณในช่วงเวลาที่เลือก' : 'No budget data found for the selected period'}
          </div>
        </div>
      )}

    </div>
  )
}
