"use client"

import { PiggyBank, ReceiptText, Wallet } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'
import { getTranslation } from '@/lib/translations'

function CardInfo({ budgetList }) {

    const[totalBudget, setTotalBudget]=useState(0);
    const[totalSpend, setTotalSpend]=useState(0);
    const { language } = useLanguage();

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
    {budgetList?.length > 0 ?
    <div className='mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
      
       <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between dark:border-slate-700 dark:bg-slate-800'>
            <div>
                <h2 className='text-sm text-slate-500 dark:text-slate-400'>{getTranslation(language, 'cardInfo.totalBudget')}</h2>
                <h2 className='font-bold text-2xl'>฿{totalBudget.toLocaleString(currencyLocale)}</h2>
            </div>
            <PiggyBank 
            className='bg-amber-600 p-3 h-12 w-12 rounded-full text-white'/>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between dark:border-slate-700 dark:bg-slate-800'>
            <div>
                <h2 className='text-sm text-slate-500 dark:text-slate-400'>{getTranslation(language, 'cardInfo.totalSpending')}</h2>
                <h2 className='font-bold text-2xl'>฿{totalSpend.toLocaleString(currencyLocale)}</h2>
            </div>
            <ReceiptText 
            className='bg-amber-600 p-3 h-12 w-12 rounded-full text-white'/>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between dark:border-slate-700 dark:bg-slate-800'>
            <div>
                <h2 className='text-sm text-slate-500 dark:text-slate-400'>{getTranslation(language, 'cardInfo.activeBudgets')}</h2>
                <h2 className='font-bold text-2xl'>{budgetList.length}</h2>
            </div>
            <Wallet 
            className='bg-amber-600 p-3 h-12 w-12 rounded-full text-white'/>
        </div>
        </div>
    :
    <div className='mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
        { [1,2,3].map((item,index) => (
            <div key={index} className='h-40 w-full bg-slate-200 animate-pulse rounded-lg'>
            </div>
    ))}
    </div>
    }   

    </div>
  )
}

export default CardInfo