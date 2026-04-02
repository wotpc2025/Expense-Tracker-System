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
import { ThemeToggle } from '@/components/ThemeToggle'import { getTranslation } from '@/lib/translations'
import { useUser } from '@clerk/nextjs'
import { isAdminByRole } from '@/lib/adminAccess'
import { getCurrentUserAdminStatusAction } from '@/app/_actions/dbActions'

function SideNav() {
    const language = 'en';const { user } = useUser()
    const [isAdmin, setIsAdmin] = useState(isAdminByRole(user))
    const [dbStatus, setDbStatus] = useState('checking')
    const [dbLatency, setDbLatency] = useState(null)

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

    useEffect(() => {
        let isActive = true

        const checkDatabaseStatus = async () => {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 4000)

            try {
                const response = await fetch('/api/health/db', {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal,
                })
                const payload = await response.json().catch(() => null)
                if (!isActive) return

                const isOnline = response.ok && payload?.status === 'online'
                setDbStatus(isOnline ? 'online' : 'offline')
                setDbLatency(Number(payload?.latencyMs) || null)
            } catch {
                if (!isActive) return
                setDbStatus('offline')
                setDbLatency(null)
            } finally {
                clearTimeout(timeoutId)
            }
        }

        checkDatabaseStatus()
        const intervalId = setInterval(checkDatabaseStatus, 30000)

        return () => {
            isActive = false
            clearInterval(intervalId)
        }
    }, [])

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

    const dbBadgeClass = dbStatus === 'online'
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        : dbStatus === 'offline'
            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'

    const dbDotClass = dbStatus === 'online'
        ? 'bg-emerald-400'
        : dbStatus === 'offline'
            ? 'bg-rose-400'
            : 'bg-slate-400'

    const dbStatusLabel = dbStatus === 'online'
        ? (language === 'th' ? 'ออนไลน์' : 'Online')
        : dbStatus === 'offline'
            ? (language === 'th' ? 'ออฟไลน์' : 'Offline')
            : (language === 'th' ? 'กำลังเช็ก' : 'Checking')

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

            <div className='mx-2 mb-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2'>
                    <div className='flex items-center justify-between gap-3'>
                        <div className='min-w-0'>
                            <p className='text-xs text-slate-400'>
                                {language === 'th' ? 'สถานะฐานข้อมูล' : 'Database Status'}
                            </p>
                            <p className='mt-1 text-[11px] text-slate-500'>
                                {dbStatus === 'online' && dbLatency
                                    ? `${dbLatency} ms`
                                    : language === 'th'
                                        ? 'อัปเดตทุก 30 วินาที'
                                        : 'Updates every 30s'}
                            </p>
                        </div>

                        <span className={`inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 text-xs font-medium leading-none ${dbBadgeClass}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${dbDotClass}`} />
                            {dbStatusLabel}
                        </span>
                    </div>
            </div>

            <SidebarFooter className='border-t pt-2'>
                <div className='flex items-center justify-between px-1'>
                    <div className='flex items-center gap-2 text-sm font-semibold'>
                        <UserButton />
                        {userFullName}
                    </div>
                    <div className='flex items-center gap-1'>
                        <ThemeToggle />
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
  )
}

export default SideNav
