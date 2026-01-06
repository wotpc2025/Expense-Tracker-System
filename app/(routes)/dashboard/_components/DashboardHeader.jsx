import { UserButton } from '@clerk/nextjs'
import React from 'react'

function DashboardHeader() {
  return (
    <div className='p-5 shadown-sm border-b flex justify-between'>
          <div>
            
          </div>
          <div>
            <UserButton/>
            
          </div>
        
        </div>
  )
}

export default DashboardHeader