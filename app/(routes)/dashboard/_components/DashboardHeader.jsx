"use client"
/**
 * DashboardHeader.jsx — Dashboard Top Bar
 *
 * Renders the sticky top bar inside the dashboard shell:
 *   - SidebarTrigger: hamburger button to collapse/expand SideNav
 *   - Time-of-day greeting: computed client-side (morning/afternoon/evening)
 *   - Clerk UserButton: avatar + dropdown for account management
 *
 * The greeting is computed inside a useEffect + isClient guard to avoid
 * SSR hydration mismatches from time-dependent values.
 */
import { UserButton, useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { t } from '@/lib/text'



function DashboardHeader() {
  const { user, isSignedIn } = useUser();
  const language = 'en';
  const [isClient, setIsClient] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setIsClient(true);
    const hour = new Date().getHours();
    let greetKey = '';
    if (hour < 12) {
      greetKey = 'greeting.morning';
    } else if (hour < 18) {
      greetKey = 'greeting.afternoon';
    } else {
      greetKey = 'greeting.evening';
    }
    setGreeting(t(greetKey));
  }, [language]);

  return (
    <div className='p-5 shadow-sm border-b flex justify-between items-center'>
      <div>
        <SidebarTrigger className='border text-gray-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer' />
      </div>
      <div className='flex items-center gap-3 ml-auto'>
        {isClient && isSignedIn && (
          <span className='text-lg font-semibold flex items-center gap-2'>
            <span role="img" aria-label="wave">👋</span>
            {greeting}, {user?.firstName || ''}{user?.lastName ? ` ${user.lastName}` : ''}!
          </span>
        )}
        <UserButton />
      </div>
    </div>
  )
}

export default DashboardHeader