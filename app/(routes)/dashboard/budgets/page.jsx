import React from 'react'
import BudgetList from './_components/BudgetList'

function page() {
  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <div className='rounded-2xl border bg-linear-to-br from-white to-slate-50 px-4 py-4 shadow-sm sm:px-6'>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600'>Budget Center</p>
          <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>My Budgets</h1>
          <p className='mt-1 text-sm text-slate-500'>Track budget limits and monitor spending in one place.</p>
        </div>
       <BudgetList/>
    </section>
  )
}

export default page