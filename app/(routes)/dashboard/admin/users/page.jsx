"use client"
/**
 * admin/users/page.jsx — Admin User Summary Page (/dashboard/admin/users)
 *
 * Lists all registered users (by email) with aggregated budget and spending
 * statistics. Selecting a row expands a detail panel showing per-budget
 * breakdown for that specific user.
 *
 * Data flow:
 *   - getAdminUsersSummaryAction() → rows: summary row per user email
 *   - getAdminUserDetailAction(email) → detail: per-budget breakdown for one user
 *     (called on row click; collapses if the same row is clicked again)
 *
 * Formatting helpers (formatCurrency, formatDateTime) are defined locally
 * to keep the file self-contained.
 */
import React, { useEffect, useState } from 'react'
import { getAdminUserDetailAction, getAdminUsersSummaryAction } from '@/app/_actions/dbActions'
import { t } from '@/lib/text'

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

export default function AdminUsersPage() {
  const language = 'en';const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [selectedEmail, setSelectedEmail] = useState('')
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    void fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const result = await getAdminUsersSummaryAction()
    setRows(result || [])
    setLoading(false)
  }

  const openDetail = async (email) => {
    if (!email) return

    if (selectedEmail === email) {
      setSelectedEmail('')
      setDetail(null)
      setDetailLoading(false)
      return
    }

    setSelectedEmail(email)
    setDetailLoading(true)
    const result = await getAdminUserDetailAction(email)
    setDetail(result)
    setDetailLoading(false)
  }

  return (
    <div className='p-5 space-y-5'>
      <div>
        <h2 className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
          {t('adminUsers.title')}
        </h2>
        <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>
          {t('adminUsers.subtitle')}
        </p>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700 xl:col-span-2'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b dark:border-slate-700'>
                <th className='text-left pb-2 text-slate-500'>{t('adminUsers.columns.email')}</th>
                <th className='text-right pb-2 text-slate-500'>{t('adminUsers.columns.budgets')}</th>
                <th className='text-right pb-2 text-slate-500'>{t('adminUsers.columns.expenses')}</th>
                <th className='text-right pb-2 text-slate-500'>{t('adminUsers.columns.totalBudget')}</th>
                <th className='text-right pb-2 text-slate-500'>{t('adminUsers.columns.totalSpend')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className='py-8 text-center text-slate-400'>
                    {t('loading')}
                  </td>
                </tr>
              )}

              {!loading && rows.map((row) => (
                <tr
                  key={row.email}
                  className={`border-b dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 ${selectedEmail === row.email ? 'bg-slate-100 dark:bg-slate-900/50' : ''}`}
                  onClick={() => openDetail(row.email)}
                >
                  <td className='py-2 pr-3 text-slate-700 dark:text-slate-200'>
                    <p className='font-medium'>{row.displayName || row.email || '-'}</p>
                    <span className='text-xs text-slate-500 underline decoration-dotted'>{row.email || '-'}</span>
                  </td>
                  <td className='py-2 pr-3 text-right text-slate-700 dark:text-slate-200'>{row.budgets}</td>
                  <td className='py-2 pr-3 text-right text-slate-700 dark:text-slate-200'>{row.expenses}</td>
                  <td className='py-2 pr-3 text-right text-slate-700 dark:text-slate-200'>{formatCurrency(row.totalBudget)}</td>
                  <td className='py-2 text-right text-slate-700 dark:text-slate-200'>{formatCurrency(row.totalSpend)}</td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className='py-8 text-center text-slate-400'>
                    {t('adminUsers.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>

        <div className='rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700'>
          <h3 className='font-semibold text-slate-700 dark:text-slate-200 mb-3'>
            {t('adminUsers.detail.title')}
          </h3>

          {!selectedEmail && (
            <p className='text-sm text-slate-500'>
              {t('adminUsers.detail.selectUser')}
            </p>
          )}

          {detailLoading && (
            <p className='text-sm text-slate-500'>
              {t('loading')}
            </p>
          )}

          {!detailLoading && selectedEmail && detail && (
            <div className='space-y-3'>
              <div className='rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 text-sm'>
                <p className='font-medium text-slate-700 dark:text-slate-200 break-all'>{detail.displayName || detail.email}</p>
                <p className='text-xs text-slate-500 mt-1 break-all'>{detail.email}</p>
                <div className='grid grid-cols-2 gap-2 mt-2 text-slate-600 dark:text-slate-300'>
                  <p>{t('adminUsers.columns.budgets')}: {detail.summary?.budgets || 0}</p>
                  <p>{t('adminUsers.columns.expenses')}: {detail.summary?.expenses || 0}</p>
                  <p>{t('adminUsers.columns.totalBudget')}: {formatCurrency(detail.summary?.totalBudget || 0)}</p>
                  <p>{t('adminUsers.columns.totalSpend')}: {formatCurrency(detail.summary?.totalSpend || 0)}</p>
                </div>
              </div>

              <div>
                <p className='text-sm font-medium text-slate-700 dark:text-slate-200 mb-2'>
                  {t('adminUsers.detail.recentExpenses')}
                </p>
                <div className='space-y-2 max-h-72 overflow-auto'>
                  {(detail.recentExpenses || []).map((item) => (
                    <div key={item.id} className='rounded-lg border border-slate-200 dark:border-slate-700 p-2'>
                      <p className='text-sm text-slate-700 dark:text-slate-200'>{item.name}</p>
                      <p className='text-xs text-slate-500 mt-1'>{item.category || '-'} • {formatCurrency(item.amount)} • {formatDateTime(item.createdAt)}</p>
                    </div>
                  ))}
                  {(!detail.recentExpenses || detail.recentExpenses.length === 0) && (
                    <p className='text-sm text-slate-500'>{t('adminUsers.empty')}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
