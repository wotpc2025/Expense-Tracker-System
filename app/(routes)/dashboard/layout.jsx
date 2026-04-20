"use client"
/**
 * dashboard/layout.jsx — Dashboard Shell Layout
 *
 * Wraps every /dashboard/** route with:
 *   - SidebarProvider  : shadcn/ui sidebar context provider
 *   - SideNav          : persistent left navigation (collapses to icon strip on mobile)
 *   - SidebarInset     : main content area that shifts when sidebar expands
 *   - DashboardHeader  : top bar with greeting + UserButton
 *
 * Auth guard (client-side):
 *   - Waits for Clerk to hydrate (isLoaded).
 *   - Admins (detected by role metadata) are allowed through unconditionally.
 *   - Regular users who have NO budgets yet are redirected to /dashboard/budgets
 *     to prompt them to create their first budget.
 *
 * Server-side admin guard is handled by app/(routes)/dashboard/admin/layout.jsx
 * for the /admin sub-routes.
 */
import React, { useEffect } from 'react'
import SideNav from './_components/SideNav'
import DashboardHeader from './_components/DashboardHeader'
import { useUser } from '@clerk/nextjs'
// [!code --] import { db } from '@/utils/dbConfig'  <-- ลบทิ้ง!!
// [!code --] import { Budgets } from '@/utils/schema' <-- ลบทิ้ง!!
// [!code --] import { eq } from 'drizzle-orm' <-- ลบทิ้ง!!
import { checkUserBudgetsAction, getCurrentUserAdminStatusAction, syncCurrentUserProfileAction } from '@/app/_actions/dbActions' // [!code ++] Import ตัวนี้มาแทน
import { usePathname, useRouter } from 'next/navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { isAdminByRole } from '@/lib/adminAccess'

function DashboardLayout({children}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded || !user) return;

    let isActive = true

    // Keep local users table in sync with Clerk profile on dashboard visits.
    syncCurrentUserProfileAction().catch((error) => {
      console.error('User sync failed:', error)
    })

    if (pathname !== '/dashboard') {
      return () => {
        isActive = false
      }
    }

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
    <SidebarProvider>
      <SideNav />
      <SidebarInset>
        <DashboardHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
export default DashboardLayout