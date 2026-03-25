"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getAllExpensesAction } from '@/app/_actions/dbActions'
import ExpensesListTable from '../budgets/_components/ExpensesListTable'
import StatCard from '../_components/StatCard'
import { useDashboardDensity } from '@/lib/useDashboardDensity'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'
import { getTranslation } from '@/lib/translations'
import moment from 'moment'

function ExpensesPage() {
  const { user, isLoaded } = useUser();
  const { language } = useLanguage()
  const [expensesList, setExpensesList] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [density, setDensity, resolvedDensity] = useDashboardDensity('dashboard-density', 'comfortable');

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

  const summary = useMemo(() => {
    const now = moment()
    const thisMonthKey = now.format('YYYY-MM')
    const daysElapsed = now.date()
    const monthName = now.locale(language === 'th' ? 'th' : 'en').format('MMMM YYYY')

    const thisMonthExpenses = expensesList.filter(e => {
      // If no createdAt, use today's date
      const dateStr = e.createdAt || moment().format('DD/MM/YYYY')
      const m = parseDate(dateStr)
      const isThisMonth = m && m.format('YYYY-MM') === thisMonthKey
      return isThisMonth
    })
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const totalAmount = expensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const avgPerDay = daysElapsed > 0 ? thisMonthTotal / daysElapsed : 0

    const categoryTotals = {}
    expensesList.forEach(e => {
      if (e.category) categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount || 0)
    })
    const topEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
    const topCategory = topEntry ? topEntry[0] : '—'
    const topCategoryAmount = topEntry ? topEntry[1] : 0

    return { thisMonthTotal, totalAmount, avgPerDay, topCategory, topCategoryAmount, daysElapsed, monthName }
  }, [expensesList, language]);

  useEffect(() => {
    if (isLoaded && user) {
      getAllExpenses();
    }
  }, [isLoaded, user]);

  const getAllExpenses = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    setIsFetching(true);
    try {
      const result = await getAllExpensesAction(email);
      setExpensesList(result || []);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
      <div className='rounded-2xl border bg-linear-to-br from-white to-slate-50 px-4 py-4 shadow-sm sm:px-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600'>{getTranslation(language, 'expensesPage.title')}</p>
        <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>{getTranslation(language, 'expensesPage.heading')}</h1>
        <p className='mt-1 text-sm text-slate-500'>{getTranslation(language, 'expensesPage.subtitle')}</p>
      </div>

      <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'expensesStats.thisMonth')}
          value={`฿${summary.thisMonthTotal.toLocaleString('th-TH')}`}
          caption={summary.monthName}
          formula={getTranslation(language, 'expensesStats.thisMonthFormula')}
          tone='amber'
          points={expensesList
            .filter(e => { const m = parseDate(e.createdAt); return m && m.format('YYYY-MM') === moment().format('YYYY-MM') })
            .slice(-10).map(e => Number(e.amount || 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'expensesStats.totalAmount')}
          value={`฿${summary.totalAmount.toLocaleString('th-TH')}`}
          caption={`${expensesList.length} ${getTranslation(language, 'expensesStats.allRecords')}`}
          formula={getTranslation(language, 'expensesStats.totalAmountFormula')}
          tone='slate'
          points={expensesList.slice(-10).map(e => Number(e.amount || 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'expensesStats.avgPerDay')}
          value={`฿${summary.avgPerDay.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
          caption={`${summary.daysElapsed} ${language === 'th' ? 'วันในเดือนนี้' : 'days this month'}`}
          formula={getTranslation(language, 'expensesStats.avgPerDayFormula')}
          tone='emerald'
          points={Array.from({ length: summary.daysElapsed }, (_, i) => i + 1).slice(-10).map(d => summary.thisMonthTotal / d)}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'expensesStats.topCategory')}
          value={summary.topCategory}
          caption={summary.topCategoryAmount > 0 ? `฿${summary.topCategoryAmount.toLocaleString('th-TH')}` : '—'}
          formula={getTranslation(language, 'expensesStats.topCategoryFormula')}
          tone='white'
          points={expensesList.slice(-10).map(e => Number(e.amount || 0))}
        />
      </div>

      <ExpensesListTable
        expensesList={expensesList}
        refreshData={getAllExpenses}
        density={resolvedDensity}
        densityMode={density}
        onDensityChange={setDensity}
        showDensityToggle
        gridHeight='clamp(420px, calc(100vh - 270px), 820px)'
      />
    </section>
  )
}

export default ExpensesPage
