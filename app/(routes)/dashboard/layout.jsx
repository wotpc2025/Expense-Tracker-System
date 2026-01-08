"use client"
import React, { use, useEffect } from 'react'
import SideNav from './_components/SideNav'
import DashboardHeader from './_components/DashboardHeader'
import { useUser } from '@clerk/nextjs'
// [!code --] import { db } from '@/utils/dbConfig'  <-- ลบทิ้ง!!
// [!code --] import { Budgets } from '@/utils/schema' <-- ลบทิ้ง!!
// [!code --] import { eq } from 'drizzle-orm' <-- ลบทิ้ง!!
import { checkUserBudgetsAction } from '@/app/_actions/dbActions' // [!code ++] Import ตัวนี้มาแทน
import { useRouter } from 'next/navigation'

function DashboardLayout({children}) {
  const { user } = useUser();
  const router = useRouter();
  useEffect(() => {
    user && getUserBudgets();
  }, [user])

  const getUserBudgets = async () => {
    // เรียกผ่าน Action ที่เราสร้างไว้ Error จะไม่โผล่มาที่หน้าเว็บครับ
    const result = await checkUserBudgetsAction(user?.primaryEmailAddress?.emailAddress);
    console.log("Budget Result:", result);
    if(result?.length==0)
        {
            router.replace('/dashboard/budgets')
        }
  }

  return (
    <div>
      <div className='fixed md:w-64 hidden md:block'>
        <SideNav />
      </div>
      <div className='md:ml-64'>
        <DashboardHeader />
        {children}
      </div>
    </div>
  )
}
export default DashboardLayout