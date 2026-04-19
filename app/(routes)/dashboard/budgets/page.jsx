"use client"
/**
 * budgets/page.jsx — Budget List Page (/dashboard/budgets)
 *
 * Shell page for the budgets section. Renders a page header and delegates
 * all data fetching and display to the <BudgetList> component.
 *
 * This is intentionally thin — BudgetList owns all state (budget data, date
 * filter, density, stat cards, create dialog) to keep it reusable on the
 * main Dashboard page as well.
 */
import React from 'react'
import { t } from '@/lib/text'
import BudgetList from './_components/BudgetList'

function page() {
  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <div className='rounded-2xl border bg-linear-to-br from-white to-slate-50 px-4 py-4 shadow-sm sm:px-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900'>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600'>{t('budgetsPage.title')}</p>
          <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>{t('budgetsPage.heading')}</h1>
          <p className='mt-1 text-sm text-slate-500'>{t('budgetsPage.subtitle')}</p>
        </div>
       <BudgetList/>
    </section>
  )
}

export default page