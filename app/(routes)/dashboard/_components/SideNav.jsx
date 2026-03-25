"use client"

import React from 'react'
import Image from 'next/image'
import { LayoutGrid, PiggyBank, ReceiptText } from 'lucide-react'
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

function SideNav() {
    const menuList=[
        {
            id:1,
            name:'Dashboard',
            icon:LayoutGrid,
            path:'/dashboard'
        },
        {
            id:2,
            name:'Budgets',
            icon:PiggyBank,
            path:'/dashboard/budgets'
        },
        {
            id:3,
            name:'Expenses',
            icon:ReceiptText,
            path:'/dashboard/expenses'
        },
    ]
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
                        Profile
                    </div>
                    <ThemeToggle />
                </div>
            </SidebarFooter>
        </Sidebar>
  )
}

export default SideNav
