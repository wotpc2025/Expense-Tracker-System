"use client"

import React, { useEffect } from 'react'
import Image from 'next/image'
import { LayoutGrid, PiggyBank, ReceiptText, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

function SideNav({ mobile = false, onClose, onNavigate }) {
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
        {
            id:4,
            name:'Upgrade',
            icon:ShieldCheck,
            path:'/dashboard/upgrade'
        }
    ]
    const path=usePathname();

    useEffect(() => {
        if (mobile && onNavigate) {
            onNavigate();
        }
    }, [path, mobile, onNavigate])

  return (
        <div className='h-screen p-5 border shadow-sm flex flex-col bg-white'>
                    <div className='flex items-center justify-between'>
                        <Image src='/logo-exfinit.png'
                                alt="logo"
                                width={160}
                                height={100}
                        />
                        {mobile && (
                            <button
                                type='button'
                                onClick={onClose}
                                className='inline-flex items-center justify-center rounded-md border p-1 text-gray-600 hover:bg-slate-100 cursor-pointer md:hidden'
                                aria-label='Close navigation menu'
                            >
                                <X className='h-4 w-4' />
                            </button>
                        )}
                    </div>
          <div className='mt-5 flex-1 overflow-y-auto pr-1'>
                  {menuList.map((menu) => (
                  <Link href={menu.path} key={menu.id}>
                      <h2
                          className={`flex gap-2 items-center
                                    text-gray-500 font-medium
                                    mb-2
                                    p-5 cursor-pointer rounded-md
                                    hover:text-amber-600 hover:bg-amber-100
                                    ${path == menu.path ? 'text-amber-600 bg-amber-100' : ''}
                                    `}>
                          <menu.icon />
                          {menu.name}
                      </h2>
                  </Link>
              ))}
          </div>
          <div className='flex gap-2 items-center font-bold border-t pt-4 pb-2'>
            <UserButton/>
            Profile
          </div>
    </div>
  )
}

export default SideNav
