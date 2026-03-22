"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getAllExpensesAction } from '@/app/_actions/dbActions'
import ExpensesListTable from '../budgets/_components/ExpensesListTable'
import StatCard from '../_components/StatCard'
import { useDashboardDensity } from '@/lib/useDashboardDensity'

function ExpensesPage() {
  const { user, isLoaded } = useUser();
  const [expensesList, setExpensesList] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [density, setDensity, resolvedDensity] = useDashboardDensity('dashboard-density', 'comfortable');

  const summary = useMemo(() => {
    const totalExpenses = expensesList.length;
    const totalAmount = expensesList.reduce((sum, expense) => sum + Number(expense?.amount || 0), 0);
    const categoriesCount = new Set(expensesList.map((expense) => expense?.category).filter(Boolean)).size;

    return {
      totalExpenses,
      totalAmount,
      avgAmount: totalExpenses ? totalAmount / totalExpenses : 0,
      categoriesCount,
    };
  }, [expensesList]);

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
      <div className='rounded-2xl border bg-linear-to-br from-white to-slate-50 px-4 py-4 shadow-sm sm:px-6'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600'>Expense Journal</p>
        <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>My Expenses List</h1>
        <p className='mt-1 text-sm text-slate-500'>Search, filter, and export all expenses quickly.</p>
      </div>

      <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          loading={!isLoaded || isFetching}
          title='Total Expenses'
          value={summary.totalExpenses}
          caption='All entries'
          formula='COUNT(expense records)'
          tone='amber'
          points={expensesList.slice(-10).map((_, index) => index + 1)}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title='Total Amount'
          value={`฿${summary.totalAmount.toLocaleString('th-TH')}`}
          caption='Cumulative spend'
          formula='SUM(all expense amounts)'
          tone='slate'
          points={expensesList.slice(-10).map((item) => Number(item?.amount || 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title='Average Expense'
          value={`฿${summary.avgAmount.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
          caption='Per entry'
          formula='Total Amount / Total Expenses'
          tone='emerald'
          points={expensesList.slice(-10).map((item, index, arr) => {
            const partial = arr.slice(0, index + 1)
            const total = partial.reduce((sum, expense) => sum + Number(expense?.amount || 0), 0)
            return partial.length ? total / partial.length : 0
          })}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title='Categories'
          value={summary.categoriesCount}
          caption='Unique tags'
          formula='COUNT(DISTINCT category)'
          tone='white'
          points={expensesList.slice(-10).map((_, index) => ((index % 4) + 1))}
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
