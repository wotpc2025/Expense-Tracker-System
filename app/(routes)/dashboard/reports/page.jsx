"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { getBudgetListAction, getAllExpensesAction } from '@/app/_actions/dbActions'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'
import { getTranslation } from '@/lib/translations'
import { EXPORT_LANGUAGE_OPTIONS, exportRowsToCsv, formatCurrencyForLanguage, sanitizeFileNamePart } from '@/lib/csvExport'
import moment from 'moment'
import 'moment/locale/th'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Wallet, Receipt, CalendarDays, Tag, TrendingUp, TrendingDown, ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export default function ReportsPage() {
  const { user } = useUser()
  const { resolvedTheme } = useTheme()
  const { language } = useLanguage()
  const isDark = resolvedTheme === 'dark'

  const [budgetList, setBudgetList] = useState([])
  const [expensesList, setExpensesList] = useState([])
  const [loading, setLoading] = useState(true)

  const [sortKey, setSortKey] = useState('pct')
  const [sortDir, setSortDir] = useState('desc')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef(null)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sortedBudgetList = useMemo(() => {
    const getValue = (b) => {
      const budget = Number(b.amount)
      const spent  = b.totalSpend || 0
      switch (sortKey) {
        case 'name':      return b.name?.toLowerCase() || ''
        case 'amount':    return budget
        case 'spent':     return spent
        case 'remaining': return budget - spent
        case 'pct':       return budget > 0 ? (spent / budget) * 100 : 0
        default:          return 0
      }
    }
    return [...budgetList].sort((a, b) => {
      const av = getValue(a), bv = getValue(b)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [budgetList, sortKey, sortDir])

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
        spent: 'Actual Spent',
        remaining: 'Remaining',
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

    const userName = sanitizeFileNamePart(user?.fullName || 'user')
    const userEmail = sanitizeFileNamePart(user?.primaryEmailAddress?.emailAddress || 'no-email')

    exportRowsToCsv({
      rows,
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

    const userName = sanitizeFileNamePart(user?.fullName || 'user')
    const userEmail = sanitizeFileNamePart(user?.primaryEmailAddress?.emailAddress || 'no-email')
    const generatedDate = moment().format('YYYY-MM-DD HH:mm')
    const fileName = `reports-budget-performance-${userName}-${userEmail}-${selectedLanguage}-${moment().format('YYYY-MM-DD')}.pdf`

    if (selectedLanguage === 'th') {
      const rows = sortedBudgetList.map((b) => {
        const budget = Number(b.amount)
        const spent = Number(b.totalSpend || 0)
        const remaining = budget - spent
        const ratio = budget > 0 ? (spent / budget) * 100 : 0

        return `
          <tr style="background:${ratio >= 100 ? '#fef2f2' : '#ffffff'};">
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">${b.name || ''}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align:right;">${formatPdfCurrency(budget)}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align:right;">${formatPdfCurrency(spent)}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align:right;">${formatPdfCurrency(remaining)}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align:right; color:${ratio >= 100 ? '#dc2626' : '#111827'};">${ratio.toFixed(2)}%</td>
          </tr>
        `
      }).join('')

      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-10000px'
      container.style.top = '0'
      container.style.width = '1500px'
      container.style.background = '#ffffff'
      container.style.padding = '24px'
      container.innerHTML = `
        <div style="font-family: Tahoma, 'Noto Sans Thai', sans-serif; color: #111827;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                <span style="display:inline-flex; width:26px; height:26px; border-radius:6px; align-items:center; justify-content:center; background:#0f172a; color:#fff; font-size:11px; font-weight:700;">ETS</span>
                <h1 style="font-size: 24px; margin: 0;">รายงานประสิทธิภาพงบประมาณ</h1>
              </div>
              <p style="font-size: 13px; margin: 0; color:#475569;">Expense Tracker System</p>
            </div>
            <div style="text-align:right; font-size:12px; color:#334155; line-height:1.6;">
              <div><strong>วันที่สร้างรายงาน:</strong> ${generatedDate}</div>
              <div><strong>จำนวนงบทั้งหมด:</strong> ${sortedBudgetList.length} รายการ</div>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="padding: 9px 10px; text-align: left;">งบประมาณ</th>
                <th style="padding: 9px 10px; text-align: right;">จำนวนงบประมาณ</th>
                <th style="padding: 9px 10px; text-align: right;">ใช้จ่ายจริง</th>
                <th style="padding: 9px 10px; text-align: right;">คงเหลือ</th>
                <th style="padding: 9px 10px; text-align: right;">อัตราการใช้ (%)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <p style="font-size: 11px; margin-top: 10px; color: #64748b;">Generated for ${user?.fullName || 'User'} (${user?.primaryEmailAddress?.emailAddress || 'N/A'})</p>
        </div>
      `

      document.body.appendChild(container)

      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
        })

        const imgData = canvas.toDataURL('image/png')
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const imgWidth = pageWidth
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        let heightLeft = imgHeight
        let position = 0

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          doc.addPage()
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        doc.save(fileName)
      } finally {
        document.body.removeChild(container)
      }

      setShowExportMenu(false)
      return
    }

    const rows = sortedBudgetList.map((b) => {
      const budget = Number(b.amount)
      const spent = Number(b.totalSpend || 0)
      const remaining = budget - spent
      const ratio = budget > 0 ? (spent / budget) * 100 : 0

      return [
        b.name || '',
        formatPdfCurrency(budget),
        formatPdfCurrency(spent),
        formatPdfCurrency(remaining),
        `${ratio.toFixed(2)}%`,
      ]
    })

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    doc.setFillColor(15, 23, 42)
    doc.roundedRect(40, 28, 24, 24, 4, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('ETS', 46, 43)
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(16)
    doc.text('Budget Performance Report', 72, 40)
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(`Generated: ${generatedDate}`, 72, 58)
    doc.text(`Budgets: ${sortedBudgetList.length}`, 290, 58)

    autoTable(doc, {
      head: [['Budget', 'Budget Amount', 'Actual Spent', 'Remaining', 'Usage Ratio (%)']],
      body: rows,
      startY: 72,
      styles: { fontSize: 8.5, cellPadding: 4.5, textColor: [31, 41, 55] },
      headStyles: { fillColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
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
        doc.text(`Expense Tracker System • ${user?.primaryEmailAddress?.emailAddress || 'N/A'}`, 40, pageHeight - 20)
      },
    })

    doc.save(fileName)
    setShowExportMenu(false)
  }

  // ── Date parsing helper ──────────────────────────────────────────────────────

  const parseDate = (dateStr) => {
    if (!dateStr) return moment()
    const formats = ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'YYYY/MM/DD', 'DD-MM-YYYY']
    for (const fmt of formats) {
      const m = moment(dateStr, fmt, true)
      if (m.isValid()) return m
    }
    const m = moment(dateStr)
    return m.isValid() ? m : moment()
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const thisMonthKey = moment().format('YYYY-MM')
  const prevMonthKey = moment().subtract(1, 'month').format('YYYY-MM')

  const thisMonthExp = expensesList.filter(e => parseDate(e.createdAt).format('YYYY-MM') === thisMonthKey)
  const prevMonthExp = expensesList.filter(e => parseDate(e.createdAt).format('YYYY-MM') === prevMonthKey)

  const totalThisMonth = thisMonthExp.reduce((s, e) => s + Number(e.amount), 0)
  const totalPrevMonth = prevMonthExp.reduce((s, e) => s + Number(e.amount), 0)
  const totalAllTime   = expensesList.reduce((s, e) => s + Number(e.amount), 0)
  const daysElapsed    = moment().date()
  const avgPerDay      = daysElapsed > 0 ? totalThisMonth / daysElapsed : 0
  const monthChange    = totalPrevMonth > 0 ? ((totalThisMonth - totalPrevMonth) / totalPrevMonth) * 100 : null

  // Category totals
  const categoryTotals = {}
  expensesList.forEach(e => {
    const cat = e.category || 'ไม่ระบุหมวดหมู่'
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount)
  })
  const topCategory    = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
  const categoryPieData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Monthly trend — last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const m   = moment().subtract(5 - i, 'months')
    const key = m.format('YYYY-MM')
    const spend = expensesList
      .filter(e => parseDate(e.createdAt).format('YYYY-MM') === key)
      .reduce((s, e) => s + Number(e.amount), 0)
    return { month: m.format('MMM YY'), spend }
  })

  // Budget vs Actual (all budgets)
  const budgetVsActual = budgetList.map(b => ({
    name: b.name.length > 11 ? b.name.slice(0, 10) + '…' : b.name,
    งบประมาณ: Number(b.amount),
    ใช้จ่ายจริง: b.totalSpend || 0,
  }))

  // ── Chart style helpers ───────────────────────────────────────────────────────
  const gridStroke  = isDark ? '#334155' : '#e2e8f0'
  const axisColor   = isDark ? '#94a3b8' : '#64748b'
  const ttStyle     = CustomTooltipStyle(isDark)

  // ── KPI cards config ──────────────────────────────────────────────────────────
  const kpiCards = [
    {
      title: 'ใช้จ่ายเดือนนี้',
      value: fmt(totalThisMonth),
      sub: monthChange !== null
        ? `${monthChange > 0 ? '▲' : '▼'} ${Math.abs(monthChange).toFixed(1)}% จากเดือนก่อน`
        : `${moment().format('MMMM YYYY')}`,
      positive: monthChange !== null ? monthChange <= 0 : true,
      showTrend: monthChange !== null,
      Icon: Wallet,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/30',
    },
    {
      title: 'ค่าใช้จ่ายทั้งหมด',
      value: fmt(totalAllTime),
      sub: `${expensesList.length} รายการทั้งหมด`,
      Icon: Receipt,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      title: 'เฉลี่ยต่อวัน',
      value: fmt(avgPerDay),
      sub: `${daysElapsed} วันในเดือนนี้`,
      Icon: CalendarDays,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    },
    {
      title: 'หมวดหมู่สูงสุด',
      value: topCategory ? topCategory[0] : '—',
      sub: topCategory ? fmt(topCategory[1]) : 'ยังไม่มีข้อมูล',
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
            {getTranslation(language, 'reports.subtitle')} — {getTranslation(language, 'reports.lastUpdated')} {moment().format('D MMMM YYYY')}
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
            Export CSV
            <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </Button>
          {showExportMenu && (
            <div className='absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg z-20 p-1 dark:border-slate-700 dark:bg-slate-800'>
              <button
                type='button'
                onClick={() => exportBudgetPerformanceCSV('th')}
                className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer dark:hover:bg-slate-700'
              >
                Export ไทย (TH)
              </button>
              <button
                type='button'
                onClick={() => exportBudgetPerformanceCSV('en')}
                className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer dark:hover:bg-slate-700'
              >
                Export English (EN)
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
                formatter={(v) => [fmt(v), 'ใช้จ่าย']}
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
              ยังไม่มีข้อมูลค่าใช้จ่าย
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
              <Bar dataKey='งบประมาณ' fill='#10b981' radius={[5, 5, 0, 0]} />
              <Bar dataKey='ใช้จ่ายจริง' fill='#6366f1' radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex items-center justify-center h-65 text-slate-400 dark:text-slate-500 text-sm'>
            ยังไม่มีข้อมูล Budget
          </div>
        )}
      </div>

      {/* ── Budget Performance Table ── */}
      {budgetList.length > 0 && (
        <div className='border rounded-2xl p-5 bg-white dark:border-slate-700 dark:bg-slate-800'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200 mb-4'>{getTranslation(language, 'reports.budgetPerformance')}</h3>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b dark:border-slate-700'>
                  {[['name','left','reports.budget'],['amount','right','reports.budgetAmount'],['spent','right','reports.actualSpent'],['remaining','right','reports.remaining'],['pct','left','reports.ratio']].map(([key, align, tKey]) => (
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
                  const spent   = b.totalSpend || 0
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

    </div>
  )
}
