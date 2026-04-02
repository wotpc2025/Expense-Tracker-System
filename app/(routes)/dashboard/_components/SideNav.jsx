"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Database, LayoutGrid, PiggyBank, ReceiptText, Shield, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageToggle } from '@/components/LanguageToggle'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'
import { getTranslation } from '@/lib/translations'
import { useUser } from '@clerk/nextjs'
import { isAdminByRole } from '@/lib/adminAccess'
import { getCurrentUserAdminStatusAction } from '@/app/_actions/dbActions'

function SideNav() {
    const { language } = useLanguage()
    const { user } = useUser()
    const [isAdmin, setIsAdmin] = useState(isAdminByRole(user))

    useEffect(() => {
        let isActive = true

        if (isAdminByRole(user)) {
            setIsAdmin(true)
            return () => {
                isActive = false
            }
        }

        getCurrentUserAdminStatusAction()
            .then((result) => {
                if (!isActive) return
                setIsAdmin(Boolean(result))
            })
            .catch(() => {
                if (!isActive) return
                setIsAdmin(false)
            })

        return () => {
            isActive = false
        }
    }, [user])

    // Get user's first and last name (fallback to email if not available)
    const userFirstName = user?.firstName || ''
    const userLastName = user?.lastName || ''
    const userFullName = (userFirstName || userLastName) ? `${userFirstName} ${userLastName}`.trim() : (user?.emailAddresses?.[0]?.emailAddress || '')

    const adminMenuList = [
        {
            id: 1,
            name: getTranslation(language, 'nav.adminMonitoring'),
            icon: Shield,
            path: '/dashboard/admin',
        },
        {
            id: 2,
            name: getTranslation(language, 'nav.adminUsers'),
            icon: Users,
            path: '/dashboard/admin/users',
        },
        {
            id: 3,
            name: getTranslation(language, 'nav.adminDatabase'),
            icon: Database,
            path: '/dashboard/admin/database',
        },
    ]

    const userMenuList=[
        {
            id:1,
            name: getTranslation(language, 'nav.dashboard'),
            icon:LayoutGrid,
            path:'/dashboard'
        },
        {
            id:2,
            name: getTranslation(language, 'nav.budgets'),
            icon:PiggyBank,
            path:'/dashboard/budgets'
        },
        {
            id:3,
            name: getTranslation(language, 'nav.expenses'),
            icon:ReceiptText,
            path:'/dashboard/expenses'
        },
        {
            id:4,
            name: getTranslation(language, 'nav.reports'),
            icon:TrendingUp,
            path:'/dashboard/reports'
        },
    ]

    const menuList = isAdmin ? adminMenuList : userMenuList
    const path=usePathname();

  return (
        <Sidebar>
            <SidebarHeader className='border-b'>
                <Link href='/dashboard' className='inline-block cursor-pointer'>
                    <div className='rounded-lg px-2 py-1 dark:bg-white'>
                        <Image
                            src='/logo-exfinit.png'
                            alt='logo'
                            width={160}
                            height={100}
                        />
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuList.map((menu) => (
                                <SidebarMenuItem key={menu.id}>
                                    <SidebarMenuButton asChild isActive={path === menu.path}>
                                        <Link href={menu.path}>
                                            <menu.icon className='h-4 w-4' />
                                            <span>{menu.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className='border-t'>
                <div className='flex items-center justify-between px-1'>
                    <div className='flex items-center gap-2 text-sm font-semibold'>
                        <UserButton />
                        {userFullName}
                    </div>
                    <div className='flex items-center gap-1'>
                        <LanguageToggle />
                        <ThemeToggle />
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
  )
}

export default SideNav
