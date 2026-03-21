import { UserButton } from '@clerk/nextjs'
import { Menu } from 'lucide-react'
import React from 'react'

function DashboardHeader({ onToggleMobileNav }) {
  return (
    <div className='p-5 shadown-sm border-b flex justify-between'>
          <div>
            <button
              type='button'
              onClick={onToggleMobileNav}
              className='inline-flex items-center justify-center rounded-md border px-2 py-2 text-gray-600 hover:bg-slate-100 cursor-pointer'
              aria-label='Toggle navigation menu'
              title='Toggle navigation menu'
            >
              <Menu className='h-5 w-5' />
            </button>
          </div>
          <div>
            <UserButton/>
            
          </div>
        
        </div>
  )
}

export default DashboardHeader