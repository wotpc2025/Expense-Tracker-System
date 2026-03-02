import React from 'react'

function BudgetItem({budget}) {

  return (
    <div className='p-5 border rounded-lg 
    hover:shadow-md cursor-pointer'>
        <div className='flex gap-2 items-center justify-between'>
        <div className='flex gap-2 items-center'>
            <h2 className='text-3xl p-3
             bg-slate-100 rounded-full
             '>{budget?.icon}</h2>
             <div className='font-bold'>
                <h2 className='font-bold'>{budget.name}</h2>
                <h2 className='text-sm text-gray-500'>{budget.totalItem} Item</h2>
             </div>
            
         </div>
         <h2 className='font-bold text-green-400 text-lg'> ${budget.amount}</h2>
         </div>

         <div className='mt-5'>
            <div className='flex items-center justify-between mb-3'>
                <h2 className='font-bold text-xs text-slate-400'>${budget.totalSpend?budget.totalSpend:0} Spend</h2>
                <h2 className='font-bold text-xs text-slate-400'>${budget.amount-budget.totalSpend} Remaining</h2>
            </div>
            <div className='w-full 
                 bg-slate-300 h-2 rounded-full'>
                <div className='w-[40%]
                 bg-green-700 h-2 rounded-full'>
                
                </div>

            </div>
         </div>
    </div>
  )
}

export default BudgetItem