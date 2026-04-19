"use client"
/**
 * CardInfo.jsx — Dashboard Summary Cards
 *
 * Displays three KPI cards at the top of the Dashboard:
 *   1. Total Budget  — sum of all budgets' amount field
 *   2. Total Spend   — sum of all budgets' totalSpend (pre-computed by DB query)
 *   3. Active Budgets— count of budget records
 *
 * All values are derived from the budgetList prop, recalculated by
 * CalculateCardInfo() whenever budgetList changes.
 *
 * Loading state: shows 3 animated skeleton divs while data is being fetched.
 * Empty state: shows a CTA link to /dashboard/budgets when no budgets exist.
 *
 * Props:
 *   budgetList {object[]}  - list of budget objects (with totalSpend)
 *   isLoading  {boolean}   - shows skeleton pulse animation when true
 */
import { PiggyBank, ReceiptText, Wallet } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { t } from '@/lib/text'

function CardInfo({ budgetList, isLoading = false }) {

    const[totalBudget, setTotalBudget]=useState(0);
    const[totalSpend, setTotalSpend]=useState(0);
    const language = 'en';

    useEffect(() => {
        CalculateCardInfo();
      }, [budgetList]);

    const CalculateCardInfo=()=>{
        let totalBudget_=0;
        let totalSpend_=0;

        budgetList.forEach(element => {
            totalBudget_=totalBudget_ + Number(element.amount || 0);
            totalSpend_=totalSpend_ + Number(element.totalSpend || 0);
        }); 

        setTotalBudget(totalBudget_);
        setTotalSpend(totalSpend_);
    }

    // เลือก locale ตามภาษา
    const currencyLocale = language === 'th' ? 'th-TH' : 'en-US';

    return (
        <div>
            {isLoading ? (
                <div className='mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                    {[1, 2, 3].map((item, index) => (
                        <div key={`${item}-${index}`} className='h-40 w-full bg-slate-200 animate-pulse rounded-lg'></div>
                    ))}
                </div>
            ) : (
                <>
                    <div className='mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                        <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between dark:border-slate-700 dark:bg-slate-800'>
                            <div>
                                <h2 className='text-sm text-slate-500 dark:text-slate-400'>{t('cardInfo.totalBudget')}</h2>
                                <h2 className='font-bold text-2xl'>฿{totalBudget.toLocaleString(currencyLocale)}</h2>
                            </div>
                            <PiggyBank className='bg-amber-600 p-3 h-12 w-12 rounded-full text-white' />
                        </div>
                        <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between dark:border-slate-700 dark:bg-slate-800'>
                            <div>
                                <h2 className='text-sm text-slate-500 dark:text-slate-400'>{t('cardInfo.totalSpending')}</h2>
                                <h2 className='font-bold text-2xl'>฿{totalSpend.toLocaleString(currencyLocale)}</h2>
                            </div>
                            <ReceiptText className='bg-amber-600 p-3 h-12 w-12 rounded-full text-white' />
                        </div>
                        <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between dark:border-slate-700 dark:bg-slate-800'>
                            <div>
                                <h2 className='text-sm text-slate-500 dark:text-slate-400'>{t('cardInfo.activeBudgets')}</h2>
                                <h2 className='font-bold text-2xl'>{budgetList.length}</h2>
                            </div>
                            <Wallet className='bg-amber-600 p-3 h-12 w-12 rounded-full text-white' />
                        </div>
                    </div>

                    {budgetList?.length === 0 && (
                        <div className='mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300'>
                            <p>{t('dashboard.noBudgetData')}</p>
                            <Link
                                href='/dashboard/budgets'
                                className='mt-3 inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700'
                            >
                                {t('budgets.createNew')}
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default CardInfo