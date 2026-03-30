"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getBudgetListAction } from '@/app/_actions/dbActions'
import BudgetItem from './BudgetItem'
import CreateBudget from './CreateBudget'
import { LayoutGrid, List, MonitorCog, PiggyBank, PlusCircle, RotateCcw, ScanLine } from 'lucide-react'
import StatCard from '../../_components/StatCard'
import { useDashboardDensity } from '@/lib/useDashboardDensity'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'
import { getTranslation } from '@/lib/translations'

function BudgetList() {
  // All hooks must be at the top before any useEffect
  const [budgetList, setBudgetList] = useState([]); // สร้าง State ไว้เก็บข้อมูลที่ดึงมา
  const [isFetching, setIsFetching] = useState(false);
  const [density, setDensity, resolvedDensity, resetDensity] = useDashboardDensity('dashboard-density', 'comfortable');
  const { user, isLoaded } = useUser();
  const { language } = useLanguage();
  const currencyLocale = language === 'th' ? 'th-TH' : 'en-US';
  const getBudgetList = React.useCallback(async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      console.warn("Email not available");
      return;
    }
    setIsFetching(true);
    try {
      const result = await getBudgetListAction(email);
      if (result && result.length > 0) {
        setBudgetList(result);
      } else {
        setBudgetList([]);
      }
    } finally {
      setIsFetching(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (isLoaded && user) {
      getBudgetList();
    }
  }, [isLoaded, user, language, getBudgetList]);

  const summary = useMemo(() => {
    const totalBudget = budgetList.reduce((sum, budget) => sum + Number(budget?.amount || 0), 0);
    const totalSpend = budgetList.reduce((sum, budget) => sum + Number(budget?.totalSpend || 0), 0);
    const activeBudgets = budgetList.length;
    return {
      totalBudget,
      totalSpend,
      remaining: totalBudget - totalSpend,
      activeBudgets,
    };
  }, [budgetList]);
  return (
    <div className='mt-5 sm:mt-6'>
      {/* Summary cards + sparklines */}
      <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:mb-5'>
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'budgetStats.totalBudget')}
          value={`฿${summary.totalBudget.toLocaleString(currencyLocale)}`}
          caption={getTranslation(language, 'budgetStats.budgetCapacity')}
          formula={getTranslation(language, 'budgetStats.totalBudgetFormula')}
          tone='amber'
          points={budgetList.slice(-6).map((item) => Number(item?.amount || 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'budgetStats.totalSpend')}
          value={`฿${summary.totalSpend.toLocaleString(currencyLocale)}`}
          caption={getTranslation(language, 'budgetStats.moneyUsed')}
          formula={getTranslation(language, 'budgetStats.totalSpendFormula')}
          tone='slate'
          points={budgetList.slice(-6).map((item) => Number(item?.totalSpend || 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'budgetStats.remaining')}
          value={`฿${Math.max(summary.remaining, 0).toLocaleString(currencyLocale)}`}
          caption={getTranslation(language, 'budgetStats.availableNow')}
          formula={getTranslation(language, 'budgetStats.remainingFormula')}
          tone='emerald'
          points={budgetList.slice(-6).map((item) => Math.max(Number(item?.amount || 0) - Number(item?.totalSpend || 0), 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'budgetStats.activeBudgets')}
          value={summary.activeBudgets}
          caption={getTranslation(language, 'budgetStats.currentPlans')}
          formula={getTranslation(language, 'budgetStats.activeBudgetsFormula')}
          tone='white'
          points={budgetList.slice(-6).map((item, index) => index + 1)}
        />
      </div>

      <div className='mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-5'>
        <CreateBudget
          refreshData={getBudgetList}
          trigger={
            <button className='inline-flex h-10 items-center overflow-hidden rounded-xl border border-amber-400 shadow-sm cursor-pointer group transition-all hover:shadow-md dark:border-amber-600'>
              <span className='flex items-center gap-2 bg-amber-500 px-4 h-full text-white text-sm font-semibold group-hover:bg-amber-600 transition-colors'>
                <PiggyBank className='h-4 w-4 shrink-0' />
                {getTranslation(language, 'budgets.createNew')}
              </span>
              <span className='w-px self-stretch bg-amber-300 dark:bg-amber-600' />
              <span className='flex items-center gap-2 px-4 h-full text-amber-700 dark:text-amber-300 text-sm font-medium bg-amber-50 dark:bg-amber-950/40 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors'>
                <ScanLine className='h-4 w-4 shrink-0' />
                {getTranslation(language, 'createBudget.scanReceipt')}
              </span>
            </button>
          }
        />

        <div className='inline-flex h-10 items-center rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900'>
          <button
            type='button'
            onClick={() => setDensity('compact')}
            className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              density === 'compact' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <List className='h-3.5 w-3.5' />
            {getTranslation(language, 'density.compact')}
          </button>
          <button
            type='button'
            onClick={() => setDensity('comfortable')}
            className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              density === 'comfortable' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutGrid className='h-3.5 w-3.5' />
            {getTranslation(language, 'density.comfort')}
          </button>
          <button
            type='button'
            onClick={() => setDensity('auto')}
            className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              density === 'auto' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            title={`Auto mode is currently ${resolvedDensity}`}
          >
            <MonitorCog className='h-3.5 w-3.5' />
            {getTranslation(language, 'density.auto')}
          </button>
          <button
            type='button'
            onClick={resetDensity}
            className='inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer dark:text-slate-300 dark:hover:bg-slate-700'
            title={getTranslation(language, 'expensesTable.resetDensity')}
          >
            <RotateCcw className='h-3.5 w-3.5' />
            {getTranslation(language, 'expensesTable.reset')}
          </button>
        </div>
      </div>
              <button
                type='button'
                onClick={() => setDensity('comfortable')}
                className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  density === 'comfortable' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className='h-3.5 w-3.5' />
                {getTranslation(language, 'density.comfort')}
              </button>
              <button
                type='button'
                onClick={() => setDensity('auto')}
                className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  density === 'auto' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                title={getTranslation(language, 'density.autoModeTooltip') + resolvedDensity}
              >
                <MonitorCog className='h-3.5 w-3.5' />
                {getTranslation(language, 'density.auto')}
              </button>
              <button
                type='button'
                onClick={resetDensity}
                className='inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer dark:text-slate-300 dark:hover:bg-slate-700'
                title={getTranslation(language, 'density.resetTooltip')}
              >
                <RotateCcw className='h-3.5 w-3.5' />
                {getTranslation(language, 'density.reset')}
              </button>


      <div className={`grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 ${resolvedDensity === 'compact' ? 'gap-3 sm:gap-4' : 'gap-4 sm:gap-5'}`}>
        {isFetching
          ? [1,2,3,4,5].map((item,index) => (
              <div key={index} className={`w-full animate-pulse rounded-xl bg-slate-200 ${resolvedDensity === 'compact' ? 'h-34' : 'h-40'}`}></div>
            ))
          : budgetList?.length > 0
            ? budgetList.map((budget, index) => (
                <BudgetItem budget={budget} density={resolvedDensity} key={index} />
              ))
            : null
        }
      </div>
    </div>
  )
}

export default BudgetList