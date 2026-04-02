"use client"
import React, { useEffect } from 'react'
import SideNav from './_components/SideNav'
import DashboardHeader from './_components/DashboardHeader'
import { useUser } from '@clerk/nextjs'
// [!code --] import { db } from '@/utils/dbConfig'  <-- ลบทิ้ง!!
// [!code --] import { Budgets } from '@/utils/schema' <-- ลบทิ้ง!!
// [!code --] import { eq } from 'drizzle-orm' <-- ลบทิ้ง!!
import { checkUserBudgetsAction, getCurrentUserAdminStatusAction } from '@/app/_actions/dbActions' // [!code ++] Import ตัวนี้มาแทน
import { usePathname, useRouter } from 'next/navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { LanguageProvider } from './_providers/LanguageProvider'
import { isAdminByRole } from '@/lib/adminAccess'

function DashboardLayout({children}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (pathname !== '/dashboard') return;

    let isActive = true

    if (isAdminByRole(user)) return;

    getCurrentUserAdminStatusAction().then((isAdmin) => {
      if (!isActive || isAdmin) return;
      getUserBudgets();
    });

    return () => {
      isActive = false
    }
  }, [isLoaded, user, pathname])

  const getUserBudgets = async () => {
    // เรียกผ่าน Action ที่เราสร้างไว้ Error จะไม่โผล่มาที่หน้าเว็บครับ
    const result = await checkUserBudgetsAction(user?.primaryEmailAddress?.emailAddress);
    
    if(result?.length==0)
        {
            router.replace('/dashboard/budgets')
        }
  }

  return (
    <LanguageProvider>
      <SidebarProvider>
        <SideNav />
        <SidebarInset>
          <DashboardHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </LanguageProvider>
  )
}
export default DashboardLayout