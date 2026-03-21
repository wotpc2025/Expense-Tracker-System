import Link from 'next/link'
import React from 'react'

function BudgetItem({budget}) {


  const calculateProgressPercentage = () => {
    //(spend/total)*100
    const percentage = (budget.totalSpend / budget.amount) * 100;
    return percentage > 100 ? 100 : percentage; // ถ้าเกิน 100% ให้แสดงแค่ 100%
  }
  return (
    
    <Link href={`/dashboard/expenses/${budget?.id}`} >
      <div className='p-5 border rounded-lg 
    hover:shadow-md cursor-pointer h-42.5'>
        <div className='flex gap-2 items-center justify-between'>
        <div className='flex gap-2 items-center'>
            <h2 className='text-3xl p-3
             bg-slate-100 rounded-full
           '>{budget?.icon || '😀'}</h2>
             <div className='font-bold'>
                <h2 className='font-bold'>{budget?.name}</h2>
                <h2 className='text-sm text-gray-500'>{budget?.totalItem} Item</h2>
             </div>
            
         </div>
         <h2 className='font-bold text-green-400 text-lg'>฿{budget?.amount?.toLocaleString('th-TH')}</h2>
         </div>

         <div className='mt-5'>
            <div className='flex items-center justify-between mb-3'>
                <h2 className='font-bold text-xs text-slate-400'>฿{budget?.totalSpend ? budget?.totalSpend?.toLocaleString('th-TH') : 0} Spend</h2>
                <h2 className='font-bold text-xs text-slate-400'>฿{(budget?.amount - (budget?.totalSpend || 0))?.toLocaleString('th-TH')} Remaining</h2>
            </div>
            <div className='w-full 
                 bg-slate-300 h-2 rounded-full'>
                <div className='
                 bg-green-700 h-2 rounded-full'
                 style={{
                  width: `${calculateProgressPercentage()}%`
                 }}
                 >
                
                </div>

            </div>
            <div className='flex justify-end mt-1'>
              <h2 className='text-xs font-semibold text-slate-500'>{calculateProgressPercentage().toFixed(1)}% used</h2>
            </div>
         </div>
      </div>   
    </Link>
  )
}

export default BudgetItem