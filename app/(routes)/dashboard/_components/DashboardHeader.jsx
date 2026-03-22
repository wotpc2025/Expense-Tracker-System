import { UserButton } from '@clerk/nextjs'
import React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'

function DashboardHeader() {
  return (
    <div className='p-5 shadown-sm border-b flex justify-between'>
          <div>
            <SidebarTrigger className='border text-gray-600 hover:bg-slate-100 cursor-pointer' />
          </div>
          <div>
            <UserButton/>
            
          </div>
        
        </div>
  )
}

export default DashboardHeader