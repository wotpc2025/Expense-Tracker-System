"use client"
import React, { useEffect, useState } from 'react'
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktopNavOpen, setIsDesktopNavOpen] = useState(true);

  useEffect(() => {
    user && getUserBudgets();
  }, [user])

  const handleToggleNav = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsDesktopNavOpen((prev) => !prev);
      return;
    }

    setIsMobileNavOpen((prev) => !prev);
  };

  const getUserBudgets = async () => {
    // เรียกผ่าน Action ที่เราสร้างไว้ Error จะไม่โผล่มาที่หน้าเว็บครับ
    const result = await checkUserBudgetsAction(user?.primaryEmailAddress?.emailAddress);
    
    if(result?.length==0)
        {
            router.replace('/dashboard/budgets')
        }
  }

  return (
    <div>
      {isMobileNavOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/40 md:hidden'
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-200 ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SideNav mobile onClose={() => setIsMobileNavOpen(false)} onNavigate={() => setIsMobileNavOpen(false)} />
      </div>

      <div className='fixed md:w-64 hidden md:block'>
        {isDesktopNavOpen && <SideNav />}
      </div>
      <div className={isDesktopNavOpen ? 'md:ml-64' : ''}>
        <DashboardHeader onToggleMobileNav={handleToggleNav} />
        {children}
      </div>
    </div>
  )
}
export default DashboardLayout