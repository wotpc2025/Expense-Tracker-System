"use client"

import React, { useEffect, useMemo, useState } from 'react'
import {
  adminBulkDeleteExpensesAction,
  adminBulkSetCategoryAction,
  getAdminMonitoringDashboardAction,
  setAdminAlertStatusAction,
} from '@/app/_actions/dbActions'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'
import { getTranslation } from '@/lib/translations'
import { AlertTriangle, Database, LineChart, Receipt, ShieldAlert, ShieldCheck, Users, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const formatCurrency = (value) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(Number(value || 0))

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('th-TH')
}

export default function AdminDashboardPage() {
  const { language } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [datePreset, setDatePreset] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedUser, setSelectedUser] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [ackAlerts, setAckAlerts] = useState({})
  const [savingAlertId, setSavingAlertId] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ open: false, kind: '' })
  const [adminData, setAdminData] = useState({
    overview: { totalUsers: 0, totalBudgets: 0, totalExpenses: 0, totalSpend: 0, avgExpense: 0 },
    monitoring: { missingCategory: 0, invalidAmount: 0, duplicateCount: 0, budgetsOverLimit: 0, txThisMonth: 0 },
    budgetRows: [],
    expenseRows: [],
    alertStates: {},
    auditRows: [],
    recentExpenses: [],
    security: {
      checks: [],
      failedChecks: 0,
      warningChecks: 0,
      telemetry: {
        receiptScan: {
          activeClientCount: 0,
          deniedTotal: 0,
          acceptedTotal: 0,
          lastDeniedAt: null,
          limit: 5,
          windowSeconds: 300,
        },
      },
    },
  })

  useEffect(() => {
    void fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const result = await getAdminMonitoringDashboardAction()
    setAdminData(result)
    setAckAlerts(result?.alertStates || {})
    setLoading(false)
  }

  const parseDate = (dateStr) => {
    if (dateStr instanceof Date) {
      return dateStr.toISOString().slice(0, 10)
    }

    const date = String(dateStr || '').trim()
    if (/^\d{4}-\d{2}-\d{2}t/i.test(date)) {
      const parsed = new Date(date)
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [dd, mm, yyyy] = date.split('/')
      return `${yyyy}-${mm}-${dd}`
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
    return null
  }

  const dateRange = useMemo(() => {
    const now = new Date()
    const toISO = (d) => d.toISOString().slice(0, 10)

    if (datePreset === 'all') return { from: null, to: null }
    if (datePreset === 'custom') {
      return {
        from: startDate || null,
        to: endDate || null,
      }
    }

    if (datePreset === '7d') {
      const from = new Date(now)
      from.setDate(now.getDate() - 6)
      return { from: toISO(from), to: toISO(now) }
    }

    if (datePreset === '30d') {
      const from = new Date(now)
      from.setDate(now.getDate() - 29)
      return { from: toISO(from), to: toISO(now) }
    }

    if (datePreset === 'month') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: toISO(from), to: toISO(now) }
    }

    return { from: null, to: null }
  }, [datePreset, startDate, endDate])

  const userOptions = useMemo(() => {
    const set = new Set()
    adminData.expenseRows.forEach((row) => {
      if (row.createdBy) set.add(String(row.createdBy).toLowerCase())
    })
    return Array.from(set).sort()
  }, [adminData.expenseRows])

  const categoryOptions = useMemo(() => {
    const set = new Set()
    adminData.expenseRows.forEach((row) => {
      if (row.category) set.add(String(row.category).trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [adminData.expenseRows])

  const filteredExpenses = useMemo(() => {
    return adminData.expenseRows.filter((row) => {
      const date = parseDate(row.createdAt)
      if (dateRange.from && (!date || date < dateRange.from)) return false
      if (dateRange.to && (!date || date > dateRange.to)) return false
      if (selectedUser !== 'all' && String(row.createdBy || '').toLowerCase() !== selectedUser) return false
      if (selectedCategory !== 'all' && String(row.category || '').trim() !== selectedCategory) return false
      return true
    })
  }, [adminData.expenseRows, dateRange, selectedUser, selectedCategory])

  const filteredMonitoring = useMemo(() => {
    const missingCategoryIds = []
    const invalidAmountIds = []
    const duplicateIds = []
    const duplicateTracker = new Map()

    filteredExpenses.forEach((row) => {
      if (!String(row.category || '').trim()) missingCategoryIds.push(row.id)
      if (Number(row.amount || 0) <= 0) invalidAmountIds.push(row.id)

      const key = [
        String(row.name || '').trim().toLowerCase(),
        Number(row.amount || 0).toFixed(2),
        String(row.createdAt || '').trim(),
        Number(row.budgetId || 0),
      ].join('|')
      const seen = duplicateTracker.get(key) || 0
      duplicateTracker.set(key, seen + 1)
      if (seen >= 1) duplicateIds.push(row.id)
    })

    const budgetSpendMap = new Map()
    filteredExpenses.forEach((row) => {
      const prev = budgetSpendMap.get(row.budgetId) || 0
      budgetSpendMap.set(row.budgetId, prev + Number(row.amount || 0))
    })

    const budgetsOverLimit = adminData.budgetRows.filter((budget) => {
      if (selectedUser !== 'all' && String(budget.createdBy || '').toLowerCase() !== selectedUser) return false
      const spent = budgetSpendMap.get(budget.id) || 0
      return spent > Number(budget.amount || 0)
    }).length

    return {
      missingCategoryIds,
      invalidAmountIds,
      duplicateIds,
      budgetsOverLimit,
      txThisMonth: filteredExpenses.length,
    }
  }, [filteredExpenses, adminData.budgetRows, selectedUser])

  const filteredOverview = useMemo(() => {
    const userSet = new Set(filteredExpenses.map((row) => String(row.createdBy || '').toLowerCase()).filter(Boolean))
    const budgetSet = new Set(filteredExpenses.map((row) => Number(row.budgetId || 0)).filter(Boolean))
    const totalSpend = filteredExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    const totalExpenses = filteredExpenses.length

    return {
      totalUsers: userSet.size,
      totalBudgets: budgetSet.size,
      totalExpenses,
      totalSpend,
      avgExpense: totalExpenses > 0 ? totalSpend / totalExpenses : 0,
    }
  }, [filteredExpenses])

  const alerts = useMemo(() => {
    const items = []
    if (filteredMonitoring.invalidAmountIds.length > 0) {
      items.push({ id: 'invalid', level: 'critical', text: `${filteredMonitoring.invalidAmountIds.length} invalid amount records detected.` })
    }
    if (filteredMonitoring.duplicateIds.length > 0) {
      items.push({ id: 'duplicate', level: 'warn', text: `${filteredMonitoring.duplicateIds.length} possible duplicates detected.` })
    }
    if (filteredMonitoring.missingCategoryIds.length > 0) {
      items.push({ id: 'missing-category', level: 'warn', text: `${filteredMonitoring.missingCategoryIds.length} records are missing category.` })
    }
    if (filteredMonitoring.budgetsOverLimit > 0) {
      items.push({ id: 'over-limit', level: 'info', text: `${filteredMonitoring.budgetsOverLimit} budgets are over spending limit.` })
    }
    return items
  }, [filteredMonitoring])

  const auditLog = useMemo(() => {
    return (adminData.auditRows || []).slice(0, 12).map((row) => ({
      id: row.id,
      event: row.message,
      actor: row.actorEmail,
      createdAt: row.createdAt,
    }))
  }, [adminData.auditRows])

  const securityChecks = adminData.security?.checks || []
  const securityFailed = Number(adminData.security?.failedChecks || 0)
  const securityWarn = Number(adminData.security?.warningChecks || 0)
  const receiptScanTelemetry = adminData.security?.telemetry?.receiptScan || {
    activeClientCount: 0,
    deniedTotal: 0,
    acceptedTotal: 0,
    lastDeniedAt: null,
    limit: 5,
    windowSeconds: 300,
  }

  const applyBulkSetCategory = async () => {
    if (filteredMonitoring.missingCategoryIds.length === 0) return
    setWorking(true)
    const result = await adminBulkSetCategoryAction(filteredMonitoring.missingCategoryIds, 'Uncategorized')
    setWorking(false)
    if (result?.success) {
      toast.success(`Updated ${result.count} records`)
      await fetchData()
      return
    }
    toast.error(result?.error || 'Bulk update failed')
  }

  const applyDeleteInvalid = async () => {
    if (filteredMonitoring.invalidAmountIds.length === 0) return
    setWorking(true)
    const result = await adminBulkDeleteExpensesAction(filteredMonitoring.invalidAmountIds)
    setWorking(false)
    if (result?.success) {
      toast.success(`Deleted ${result.count} invalid records`)
      await fetchData()
      return
    }
    toast.error(result?.error || 'Delete failed')
  }

  const applyDeleteDuplicates = async () => {
    if (filteredMonitoring.duplicateIds.length === 0) return
    setWorking(true)
    const result = await adminBulkDeleteExpensesAction(filteredMonitoring.duplicateIds)
    setWorking(false)
    if (result?.success) {
      toast.success(`Deleted ${result.count} duplicate records`)
      await fetchData()
      return
    }
    toast.error(result?.error || 'Delete failed')
  }

  const openDeleteConfirm = (kind) => {
    if (working) return
    setConfirmDialog({ open: true, kind })
  }

  const handleConfirmDelete = async () => {
    const kind = confirmDialog.kind
    setConfirmDialog({ open: false, kind: '' })
    if (kind === 'invalid') {
      await applyDeleteInvalid()
      return
    }
    if (kind === 'duplicate') {
      await applyDeleteDuplicates()
    }
  }

  const toggleAlertAck = async (alertId) => {
    const nextValue = !Boolean(ackAlerts[alertId])
    setSavingAlertId(alertId)
    const result = await setAdminAlertStatusAction(alertId, nextValue)
    setSavingAlertId('')

    if (!result?.success) {
      toast.error(result?.error || 'Failed to update alert status')
      return
    }

    setAckAlerts((prev) => ({ ...prev, [alertId]: nextValue }))
    toast.success(nextValue ? 'Alert acknowledged' : 'Alert reopened')
    await fetchData()
  }

  const confirmDescription =
    confirmDialog.kind === 'invalid'
      ? getTranslation(language, 'admin.workbench.confirmInvalid')
      : getTranslation(language, 'admin.workbench.confirmDuplicate')

  if (loading) {
    return (
      <div className='p-5 space-y-4'>
        <div className='h-8 w-72 rounded bg-slate-200 dark:bg-slate-700 animate-pulse' />
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='h-24 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse' />
          ))}
        </div>
        <div className='h-72 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse' />
      </div>
    )
  }

  return (
    <div className='p-5 space-y-5'>
      <div>
        <h2 className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
          {getTranslation(language, 'admin.title')}
        </h2>
        <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>
          {getTranslation(language, 'admin.subtitle')}
        </p>
      </div>

      <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3'>
          <select value={datePreset} onChange={(e) => setDatePreset(e.target.value)} className='h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900'>
            <option value='all'>{getTranslation(language, 'admin.filters.allTime')}</option>
            <option value='7d'>{getTranslation(language, 'admin.filters.last7Days')}</option>
            <option value='30d'>{getTranslation(language, 'admin.filters.last30Days')}</option>
            <option value='month'>{getTranslation(language, 'admin.filters.thisMonth')}</option>
            <option value='custom'>{getTranslation(language, 'admin.filters.customRange')}</option>
          </select>

          <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={datePreset !== 'custom'} className='h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900' />
          <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={datePreset !== 'custom'} className='h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900' />

          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className='h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900'>
            <option value='all'>{getTranslation(language, 'admin.filters.allUsers')}</option>
            {userOptions.map((email) => <option key={email} value={email}>{email}</option>)}
          </select>

          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className='h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900'>
            <option value='all'>{getTranslation(language, 'admin.filters.allCategories')}</option>
            {categoryOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4'>
        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-slate-500'>{getTranslation(language, 'admin.cards.totalUsers')}</p>
            <Users className='h-4 w-4 text-purple-500' />
          </div>
          <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>{filteredOverview.totalUsers}</p>
        </div>

        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-slate-500'>{getTranslation(language, 'admin.cards.totalBudgets')}</p>
            <Database className='h-4 w-4 text-indigo-500' />
          </div>
          <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>{filteredOverview.totalBudgets}</p>
        </div>

        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-slate-500'>{getTranslation(language, 'admin.cards.totalExpenses')}</p>
            <Receipt className='h-4 w-4 text-emerald-500' />
          </div>
          <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>{filteredOverview.totalExpenses}</p>
        </div>

        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-slate-500'>{getTranslation(language, 'admin.cards.totalSpend')}</p>
            <LineChart className='h-4 w-4 text-amber-500' />
          </div>
          <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>{formatCurrency(filteredOverview.totalSpend)}</p>
        </div>

        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-slate-500'>{getTranslation(language, 'admin.cards.avgExpense')}</p>
            <ShieldCheck className='h-4 w-4 text-sky-500' />
          </div>
          <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>{formatCurrency(filteredOverview.avgExpense)}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200 mb-3'>
            {getTranslation(language, 'admin.monitoring.title')}
          </h3>
          <div className='space-y-2 text-sm'>
            <div className='flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <span>{getTranslation(language, 'admin.monitoring.missingCategory')}</span>
              <span className='font-semibold'>{filteredMonitoring.missingCategoryIds.length}</span>
            </div>
            <div className='flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <span>{getTranslation(language, 'admin.monitoring.invalidAmount')}</span>
              <span className='font-semibold'>{filteredMonitoring.invalidAmountIds.length}</span>
            </div>
            <div className='flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <span>{getTranslation(language, 'admin.monitoring.duplicates')}</span>
              <span className='font-semibold'>{filteredMonitoring.duplicateIds.length}</span>
            </div>
            <div className='flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <span>{getTranslation(language, 'admin.monitoring.budgetsOverLimit')}</span>
              <span className='font-semibold'>{filteredMonitoring.budgetsOverLimit}</span>
            </div>
            <div className='flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <span>{getTranslation(language, 'admin.monitoring.txThisMonth')}</span>
              <span className='font-semibold'>{filteredMonitoring.txThisMonth}</span>
            </div>
          </div>

          {(filteredMonitoring.invalidAmountIds.length > 0 || filteredMonitoring.duplicateIds.length > 0 || filteredMonitoring.budgetsOverLimit > 0) && (
            <div className='mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300'>
              <AlertTriangle className='h-4 w-4 mt-0.5' />
              <p className='text-sm'>{getTranslation(language, 'admin.monitoring.alert')}</p>
            </div>
          )}
        </div>

        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200 mb-3'>
            {getTranslation(language, 'admin.alerts.title')}
          </h3>
          <div className='space-y-2'>
            {alerts.length === 0 && (
              <p className='text-sm text-slate-400'>{getTranslation(language, 'admin.alerts.noAlerts')}</p>
            )}
            {alerts.map((alert) => {
              const isAck = Boolean(ackAlerts[alert.id])
              const isSaving = savingAlertId === alert.id
              const levelClass = alert.level === 'critical'
                ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'
                : alert.level === 'warn'
                  ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300'
                  : 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300'

              return (
                <div key={alert.id} className={`rounded-lg border p-3 ${levelClass} ${isAck ? 'opacity-60' : ''}`}>
                  <p className='text-sm'>{alert.text}</p>
                  <button
                    type='button'
                    className='mt-2 text-xs underline cursor-pointer disabled:opacity-50'
                    disabled={isSaving}
                    onClick={() => toggleAlertAck(alert.id)}
                  >
                    {isAck ? getTranslation(language, 'admin.alerts.unack') : getTranslation(language, 'admin.alerts.ack')}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200 mb-3'>
            {getTranslation(language, 'admin.workbench.title')}
          </h3>
          <div className='space-y-2 text-sm'>
            <div className='flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <span>{getTranslation(language, 'admin.workbench.fixMissingCategory')}</span>
              <button type='button' disabled={working || filteredMonitoring.missingCategoryIds.length === 0} onClick={applyBulkSetCategory} className='inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-xs text-white disabled:opacity-50'>
                <Wrench className='h-3 w-3' />
                {getTranslation(language, 'admin.workbench.run')}
              </button>
            </div>
            <div className='flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <span>{getTranslation(language, 'admin.workbench.deleteInvalidAmount')}</span>
              <button type='button' disabled={working || filteredMonitoring.invalidAmountIds.length === 0} onClick={() => openDeleteConfirm('invalid')} className='inline-flex items-center gap-1 rounded bg-rose-600 px-2.5 py-1 text-xs text-white disabled:opacity-50'>
                <Wrench className='h-3 w-3' />
                {getTranslation(language, 'admin.workbench.run')}
              </button>
            </div>
            <div className='flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <span>{getTranslation(language, 'admin.workbench.removeDuplicates')}</span>
              <button type='button' disabled={working || filteredMonitoring.duplicateIds.length === 0} onClick={() => openDeleteConfirm('duplicate')} className='inline-flex items-center gap-1 rounded bg-rose-600 px-2.5 py-1 text-xs text-white disabled:opacity-50'>
                <Wrench className='h-3 w-3' />
                {getTranslation(language, 'admin.workbench.run')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-slate-700 dark:text-slate-200'>Security Health</h3>
            <ShieldAlert className={`h-4 w-4 ${securityFailed > 0 ? 'text-rose-500' : securityWarn > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>

          <div className='mb-3 flex items-center gap-2 text-xs'>
            <span className='rounded-full bg-rose-100 px-2 py-1 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'>Fail: {securityFailed}</span>
            <span className='rounded-full bg-amber-100 px-2 py-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'>Warn: {securityWarn}</span>
            <span className='rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>Pass: {Math.max(0, securityChecks.length - securityFailed - securityWarn)}</span>
          </div>

          <div className='space-y-2'>
            {securityChecks.length === 0 && (
              <p className='text-sm text-slate-400'>No security checks loaded</p>
            )}
            {securityChecks.map((check) => {
              const tone = check.status === 'fail'
                ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300'
                : check.status === 'warn'
                  ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300'

              return (
                <div key={check.id} className={`rounded-lg border p-3 ${tone}`}>
                  <p className='text-sm font-medium'>{check.label}</p>
                  <p className='text-xs mt-1'>{check.detail}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200 mb-3'>API Abuse Monitor</h3>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div className='rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <p className='text-slate-500'>Receipt API accepted</p>
              <p className='font-semibold text-slate-700 dark:text-slate-200'>{receiptScanTelemetry.acceptedTotal}</p>
            </div>
            <div className='rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <p className='text-slate-500'>Rate-limited blocked</p>
              <p className='font-semibold text-slate-700 dark:text-slate-200'>{receiptScanTelemetry.deniedTotal}</p>
            </div>
            <div className='rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <p className='text-slate-500'>Active client IPs</p>
              <p className='font-semibold text-slate-700 dark:text-slate-200'>{receiptScanTelemetry.activeClientCount}</p>
            </div>
            <div className='rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2'>
              <p className='text-slate-500'>Policy</p>
              <p className='font-semibold text-slate-700 dark:text-slate-200'>{receiptScanTelemetry.limit} requests / {Math.round(Number(receiptScanTelemetry.windowSeconds || 0) / 60)} min</p>
            </div>
          </div>
          <p className='mt-3 text-xs text-slate-500'>Last blocked attempt: {receiptScanTelemetry.lastDeniedAt || '-'}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200 mb-3'>
            {getTranslation(language, 'admin.audit.title')}
          </h3>
          <div className='space-y-2 text-sm'>
            {auditLog.length === 0 && (
              <p className='text-slate-400'>{getTranslation(language, 'admin.audit.empty')}</p>
            )}
            {auditLog.map((entry) => (
              <div key={entry.id} className='rounded-lg border border-slate-200 dark:border-slate-700 p-3'>
                <p className='font-medium text-slate-700 dark:text-slate-200'>{entry.event}</p>
                <p className='text-xs text-slate-500 mt-1'>{entry.actor || '-'} • {formatDateTime(entry.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200 mb-3'>
            {getTranslation(language, 'admin.recent.title')}
          </h3>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b dark:border-slate-700'>
                  <th className='text-left pb-2 text-slate-500'>{getTranslation(language, 'admin.recent.name')}</th>
                  <th className='text-left pb-2 text-slate-500'>{getTranslation(language, 'admin.recent.category')}</th>
                  <th className='text-right pb-2 text-slate-500'>{getTranslation(language, 'admin.recent.amount')}</th>
                  <th className='text-right pb-2 text-slate-500'>{getTranslation(language, 'admin.recent.date')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.slice(0, 10).map((item) => (
                  <tr key={item.id} className='border-b dark:border-slate-700/50'>
                    <td className='py-2 pr-3 text-slate-700 dark:text-slate-200'>{item.name}</td>
                    <td className='py-2 pr-3 text-slate-500'>{item.category || '-'}</td>
                    <td className='py-2 pr-3 text-right text-slate-700 dark:text-slate-200'>
                      {formatCurrency(item.amount)}
                    </td>
                    <td className='py-2 text-right text-slate-500'>{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className='py-6 text-center text-slate-400'>
                      {getTranslation(language, 'admin.recent.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getTranslation(language, 'admin.workbench.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{getTranslation(language, 'cancel')}</AlertDialogCancel>
            <AlertDialogAction className='bg-rose-600 hover:bg-rose-700 text-white' onClick={handleConfirmDelete}>
              {getTranslation(language, 'delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
