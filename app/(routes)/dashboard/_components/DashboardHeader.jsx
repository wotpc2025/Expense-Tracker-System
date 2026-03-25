import { UserButton } from '@clerk/nextjs'
import React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'

function DashboardHeader() {
  return (
    <div className='p-5 shadow-sm border-b flex justify-between items-center'>
          <div>
            <SidebarTrigger className='border text-gray-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer' />
          </div>
          <div className='flex items-center gap-3'>
            <UserButton />
          </div>
        </div>
  )
}

export default DashboardHeader