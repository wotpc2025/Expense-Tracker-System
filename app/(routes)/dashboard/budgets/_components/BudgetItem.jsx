import Link from 'next/link'
import React from 'react'
import { getTranslation } from '@/lib/translations'

function BudgetItem({ budget, density = 'comfortable' }) {
  const language = 'en'
  const currencyLocale = 'en-US'
  const calculateProgressPercentage = () => {
    if (!budget?.amount) return 0;
    const percentage = (Number(budget?.totalSpend || 0) / Number(budget?.amount || 0)) * 100;
    return percentage > 100 ? 100 : percentage;
  };
  return (
    <Link href={`/dashboard/expenses/${budget?.id}`} >
      <div className={`cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:shadow-slate-700/50 ${density === 'compact' ? 'min-h-36 p-3.5 sm:p-4' : 'min-h-42 p-4 sm:p-5'}`}>
        <div className='flex gap-2 items-center justify-between'>
          <div className='flex gap-2 items-center'>
            <h2 className={`rounded-full bg-linear-to-br from-slate-100 to-slate-200 ${density === 'compact' ? 'p-2 text-xl sm:text-2xl' : 'p-2.5 text-2xl sm:p-3 sm:text-3xl'}`}>
              {budget?.icon || '😀'}
            </h2>
            <div className='font-bold min-w-0'>
              <h2 className='font-bold truncate max-w-36 sm:max-w-48'>{budget?.name}</h2>
              <h2 className='text-sm text-gray-500'>{budget?.totalItem ? `${budget.totalItem} ${getTranslation(language, 'budgetItem.items')}` : ''}</h2>
            </div>
          </div>
          <h2 className='font-bold text-emerald-500 text-base sm:text-lg'>฿{budget?.amount?.toLocaleString(currencyLocale)}</h2>
        </div>
        <div className={density === 'compact' ? 'mt-3 sm:mt-4' : 'mt-4 sm:mt-5'}>
          <div className='mb-3 flex items-center justify-between gap-2'>
            <h2 className='font-bold text-xs text-slate-400 dark:text-slate-500'>฿{budget?.totalSpend ? budget?.totalSpend?.toLocaleString(currencyLocale) : 0} {getTranslation(language, 'budgetItem.spent')}</h2>
            <h2 className='font-bold text-xs text-slate-400 dark:text-slate-500'>฿{(budget?.amount - (budget?.totalSpend || 0))?.toLocaleString(currencyLocale)} {getTranslation(language, 'budgetItem.remaining')}</h2>
          </div>
          <div className='w-full bg-slate-200 h-2 rounded-full'>
            <div className='bg-linear-to-r from-emerald-500 to-emerald-700 h-2 rounded-full'
              style={{ width: `${calculateProgressPercentage()}%` }}>
            </div>
          </div>
          <div className='flex justify-end mt-1'>
            {calculateProgressPercentage() <= 100 && (
              <h2 className='text-xs font-semibold text-slate-500 dark:text-slate-400'>{calculateProgressPercentage().toFixed(1)} {getTranslation(language, 'budgetItem.percentUsed')}</h2>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default BudgetItem