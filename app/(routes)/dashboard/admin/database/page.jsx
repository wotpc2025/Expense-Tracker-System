"use client"
/**
 * admin/database/page.jsx — Admin Database Management Page (/dashboard/admin/database)
 *
 * Provides a read-only view into all four database tables:
 *   Budgets | Expenses | AdminAlerts | AdminAuditLogs
 *
 * Features:
 *   - Tab bar to switch between table views
 *   - Summary bar: row counts per table
 *   - Full-text search (JSON.stringify filter) across all columns
 *   - Sortable columns (SortableHeader sub-component)
 *   - Pagination with configurable rows-per-page
 *   - Row click expands a detail panel (JSON dump)
 *
 * Data flow:
 *   - getAdminDatabaseManagementAction() fetches all four tables at once
 *   - All filtering and sorting is done client-side with useMemo
 *
 * This page is read-only — no mutations are triggered from here.
 * Destructive operations (bulk delete, etc.) live in admin/page.jsx.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { t } from '@/lib/text'
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Database, Receipt, ScrollText, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

const views = ['budgets', 'expenses', 'alerts', 'audit']

const defaultSortByView = {
  budgets: { key: 'id', direction: 'desc' },
  expenses: { key: 'id', direction: 'desc' },
  alerts: { key: 'id', direction: 'desc' },
  audit: { key: 'id', direction: 'desc' },
}

function SortableHeader({ label, sortKey, sortConfig, onSort, align = 'left' }) {
  const isActive = sortConfig.key === sortKey
  const Icon = !isActive ? ArrowUpDown : sortConfig.direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <th className={`pb-2 text-slate-500 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type='button'
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 font-medium ${align === 'right' ? 'justify-end' : 'justify-start'}`}
      >
        <span>{label}</span>
        <Icon className='h-3.5 w-3.5' />
      </button>
    </th>
  )
}

export default function AdminDatabasePage() {
  const language = 'en';const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('budgets')
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedRow, setSelectedRow] = useState(null)
  const [sortConfig, setSortConfig] = useState(defaultSortByView.budgets)
  const [data, setData] = useState({
    summary: { users: 0, budgets: 0, expenses: 0, activeAlerts: 0, auditEvents: 0 },
    tableCounts: { budgets: 0, expenses: 0, alerts: 0, audit: 0 },
    budgets: [],
    expenses: [],
    alerts: [],
    auditLogs: [],
  })

  useEffect(() => {
    void fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const result = await getAdminDatabaseManagementAction()
    setData(result)
    setLoading(false)
  }

  const filteredRows = useMemo(() => {
    const source = activeView === 'budgets'
      ? data.budgets
      : activeView === 'expenses'
        ? data.expenses
        : activeView === 'alerts'
          ? data.alerts
          : data.auditLogs

    const normalizedQuery = String(query || '').trim().toLowerCase()
    if (!normalizedQuery) return source

    return source.filter((row) => JSON.stringify(row).toLowerCase().includes(normalizedQuery))
  }, [activeView, data, query])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeView, query, rowsPerPage])

  useEffect(() => {
    setSelectedRow(null)
  }, [activeView])

  useEffect(() => {
    setSortConfig(defaultSortByView[activeView])
  }, [activeView])

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows]
    const { key, direction } = sortConfig

    rows.sort((leftRow, rightRow) => {
      const leftValue = leftRow?.[key]
      const rightValue = rightRow?.[key]

      const leftNumber = Number(leftValue)
      const rightNumber = Number(rightValue)
      const isNumeric = Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftValue !== '' && rightValue !== ''

      let comparison = 0
      if (isNumeric) {
        comparison = leftNumber - rightNumber
      } else {
        comparison = String(leftValue || '').localeCompare(String(rightValue || ''), undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      }

      return direction === 'asc' ? comparison : -comparison
    })

    return rows
  }, [filteredRows, sortConfig])

  const totalRows = sortedRows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = totalRows === 0 ? 0 : (safePage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows)
  const paginatedRows = sortedRows.slice(startIndex, endIndex)
  const activeRowCount = data.tableCounts?.[activeView] || 0

  const cards = [
    { key: 'users', label: t('adminDatabase.cards.users'), value: data.summary.users, icon: Users, iconClass: 'text-sky-500' },
    { key: 'budgets', label: t('adminDatabase.cards.budgets'), value: data.summary.budgets, icon: Database, iconClass: 'text-indigo-500' },
    { key: 'expenses', label: t('adminDatabase.cards.expenses'), value: data.summary.expenses, icon: Receipt, iconClass: 'text-emerald-500' },
    { key: 'activeAlerts', label: t('adminDatabase.cards.activeAlerts'), value: data.summary.activeAlerts, icon: AlertTriangle, iconClass: 'text-amber-500' },
    { key: 'auditEvents', label: t('adminDatabase.cards.auditEvents'), value: data.summary.auditEvents, icon: ScrollText, iconClass: 'text-rose-500' },
  ]

  const detailEntries = useMemo(() => {
    if (!selectedRow?.data) return []

    return Object.entries(selectedRow.data).map(([key, value]) => ({
      key,
      value: value === null || value === undefined || value === '' ? '-' : String(value),
    }))
  }, [selectedRow])

  const openRowDetail = (row) => {
    setSelectedRow({ view: activeView, data: row })
  }

  const copySelectedRowJson = async () => {
    if (!selectedRow?.data) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedRow.data, null, 2))
      toast.success(t('adminDatabase.detail.copySuccess'))
    } catch (error) {
      console.error('Failed to copy row JSON:', error)
      toast.error(t('adminDatabase.detail.copyError'))
    }
  }

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        key,
        direction: 'asc',
      }
    })
  }

  const renderTable = () => {
    if (activeView === 'budgets') {
      return (
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b dark:border-slate-700'>
              <SortableHeader label='ID' sortKey='id' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.name')} sortKey='name' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.category')} sortKey='category' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.owner')} sortKey='createdBy' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.amount')} sortKey='amount' sortConfig={sortConfig} onSort={handleSort} align='right' />
              <SortableHeader label={t('adminDatabase.columns.spend')} sortKey='totalSpend' sortConfig={sortConfig} onSort={handleSort} align='right' />
              <SortableHeader label={t('adminDatabase.columns.items')} sortKey='totalItem' sortConfig={sortConfig} onSort={handleSort} align='right' />
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className='border-b dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40' onClick={() => openRowDetail(row)}>
                <td className='py-2 pr-3 text-slate-500'>{row.id}</td>
                <td className='py-2 pr-3 text-slate-700 dark:text-slate-200'>{row.icon || '•'} {row.name}</td>
                <td className='py-2 pr-3 text-slate-500'>{row.category || '-'}</td>
                <td className='py-2 pr-3 text-slate-500'>{row.createdBy || '-'}</td>
                <td className='py-2 pr-3 text-right text-slate-700 dark:text-slate-200'>{formatCurrency(row.amount)}</td>
                <td className='py-2 pr-3 text-right text-slate-700 dark:text-slate-200'>{formatCurrency(row.totalSpend)}</td>
                <td className='py-2 text-right text-slate-700 dark:text-slate-200'>{row.totalItem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    if (activeView === 'expenses') {
      return (
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b dark:border-slate-700'>
              <SortableHeader label='ID' sortKey='id' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.name')} sortKey='name' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.budget')} sortKey='budgetName' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.category')} sortKey='category' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.owner')} sortKey='createdBy' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.amount')} sortKey='amount' sortConfig={sortConfig} onSort={handleSort} align='right' />
              <SortableHeader label={t('adminDatabase.columns.date')} sortKey='createdAt' sortConfig={sortConfig} onSort={handleSort} align='right' />
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className='border-b dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40' onClick={() => openRowDetail(row)}>
                <td className='py-2 pr-3 text-slate-500'>{row.id}</td>
                <td className='py-2 pr-3 text-slate-700 dark:text-slate-200'>{row.name}</td>
                <td className='py-2 pr-3 text-slate-500'>{row.budgetName || '-'}</td>
                <td className='py-2 pr-3 text-slate-500'>{row.category || '-'}</td>
                <td className='py-2 pr-3 text-slate-500'>{row.createdBy || '-'}</td>
                <td className='py-2 pr-3 text-right text-slate-700 dark:text-slate-200'>{formatCurrency(row.amount)}</td>
                <td className='py-2 text-right text-slate-500'>{formatDateTime(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    if (activeView === 'alerts') {
      return (
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b dark:border-slate-700'>
              <SortableHeader label='ID' sortKey='id' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.key')} sortKey='alertKey' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.status')} sortKey='status' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.actor')} sortKey='acknowledgedBy' sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('adminDatabase.columns.date')} sortKey='acknowledgedAt' sortConfig={sortConfig} onSort={handleSort} align='right' />
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className='border-b dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40' onClick={() => openRowDetail(row)}>
                <td className='py-2 pr-3 text-slate-500'>{row.id}</td>
                <td className='py-2 pr-3 text-slate-700 dark:text-slate-200'>{row.alertKey}</td>
                <td className='py-2 pr-3 text-slate-500'>{row.status}</td>
                <td className='py-2 pr-3 text-slate-500'>{row.acknowledgedBy || '-'}</td>
                <td className='py-2 text-right text-slate-500'>{formatDateTime(row.acknowledgedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    return (
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b dark:border-slate-700'>
            <SortableHeader label='ID' sortKey='id' sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader label={t('adminDatabase.columns.action')} sortKey='action' sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader label={t('adminDatabase.columns.message')} sortKey='message' sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader label={t('adminDatabase.columns.actor')} sortKey='actorEmail' sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader label={t('adminDatabase.columns.date')} sortKey='createdAt' sortConfig={sortConfig} onSort={handleSort} align='right' />
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row) => (
            <tr key={row.id} className='border-b dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40' onClick={() => openRowDetail(row)}>
              <td className='py-2 pr-3 text-slate-500'>{row.id}</td>
              <td className='py-2 pr-3 text-slate-700 dark:text-slate-200'>{row.action}</td>
              <td className='py-2 pr-3 text-slate-500'>{row.message}</td>
              <td className='py-2 pr-3 text-slate-500'>{row.actorEmail || '-'}</td>
              <td className='py-2 text-right text-slate-500'>{formatDateTime(row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className='p-5 space-y-5'>
      <div>
        <h2 className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
          {t('adminDatabase.title')}
        </h2>
        <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>
          {t('adminDatabase.subtitle')}
        </p>
      </div>

      <div className='rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200'>
        {t('adminDatabase.readOnlyNote')}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4'>
        {cards.map((card) => (
          <div key={card.key} className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
            <div className='flex items-center justify-between mb-2'>
              <p className='text-sm text-slate-500'>{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.iconClass}`} />
            </div>
            <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>{card.value}</p>
          </div>
        ))}
      </div>

      <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700 space-y-4'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-wrap gap-2'>
            {views.map((view) => (
              <button
                key={view}
                type='button'
                onClick={() => setActiveView(view)}
                className={`rounded-full px-3 py-1.5 text-sm border transition ${activeView === view ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
              >
                {t(`adminDatabase.views.${view}`)}
                <span className='ml-2 rounded-full bg-black/8 px-2 py-0.5 text-xs dark:bg-white/12'>
                  {data.tableCounts?.[view] || 0}
                </span>
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('adminDatabase.searchPlaceholder')}
            className='h-10 w-full lg:w-80 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900'
          />
        </div>

        <div className='flex flex-col gap-3 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between'>
          <p>
            {t('adminDatabase.pagination.showing')} {totalRows === 0 ? 0 : startIndex + 1}-{endIndex} {t('adminDatabase.pagination.of')} {totalRows}
            {' '}
            {t('adminDatabase.pagination.filteredFrom')} {activeRowCount}
          </p>

          <div className='flex items-center gap-2'>
            <label className='text-xs'>{t('adminDatabase.pagination.rowsPerPage')}</label>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className='h-9 rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900'
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <button
              type='button'
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className='rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-50 dark:border-slate-700'
            >
              {t('adminDatabase.pagination.previous')}
            </button>
            <span>{t('adminDatabase.pagination.page')} {safePage} {t('adminDatabase.pagination.of')} {totalPages}</span>
            <button
              type='button'
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className='rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-50 dark:border-slate-700'
            >
              {t('adminDatabase.pagination.next')}
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          {loading ? (
            <div className='py-12 text-center text-slate-400'>{t('loading')}</div>
          ) : filteredRows.length === 0 ? (
            <div className='py-12 text-center text-slate-400'>{t('adminDatabase.empty')}</div>
          ) : renderTable()}
        </div>
      </div>

      <Dialog open={Boolean(selectedRow)} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('adminDatabase.detail.title')}</DialogTitle>
            <DialogDescription>
              <div className='text-left'>
                {t('adminDatabase.detail.subtitle')} {selectedRow ? t(`adminDatabase.views.${selectedRow.view}`) : ''}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className='rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden'>
            <div className='grid grid-cols-[180px_1fr] bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400'>
              <div className='px-4 py-3'>{t('adminDatabase.detail.field')}</div>
              <div className='px-4 py-3'>{t('adminDatabase.detail.value')}</div>
            </div>
            <div className='max-h-[55vh] overflow-auto'>
              {detailEntries.map((entry) => (
                <div key={entry.key} className='grid grid-cols-[180px_1fr] border-t border-slate-200 text-sm dark:border-slate-700'>
                  <div className='px-4 py-3 font-medium text-slate-600 dark:text-slate-300'>{entry.key}</div>
                  <div className='px-4 py-3 text-slate-700 break-all dark:text-slate-200'>{entry.value}</div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <button
              type='button'
              onClick={copySelectedRowJson}
              className='inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
            >
              {t('adminDatabase.detail.copyJson')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}