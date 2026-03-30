"use client"

import { UserButton, useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'
import { getTranslation } from '@/lib/translations'



function DashboardHeader() {
  const { user, isSignedIn } = useUser();
  const { language } = useLanguage();
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
    setGreeting(getTranslation(language, greetKey));
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