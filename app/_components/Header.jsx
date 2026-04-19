"use client"
/**
 * Header.jsx — Landing Page Top Navigation Bar
 *
 * Displays the Exfinit logo, a personalised time-of-day greeting for signed-in
 * users, and a conditional CTA / UserButton:
 *   - Signed in  : shows Clerk <UserButton> (avatar + dropdown)
 *   - Signed out : shows "Get Started" button that links to /sign-up
 *
 * The greeting (morning / afternoon / evening) is computed client-side inside
 * a useEffect + isClient guard to prevent SSR/hydration mismatch for the
 * time-dependent string.
 *
 * i18n: uses getTranslation() for all visible text.
 */
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useUser,UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { getTranslation } from '@/lib/translations'

function Header() {

  const { user, isSignedIn } = useUser();
  const language = 'en';
  const [isClient, setIsClient] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setIsClient(true);
    // Set greeting based on time
    const hour = new Date().getHours();
    let greet = '';
    if (hour < 12) {
      greet = getTranslation(language, 'greeting.morning');
    } else if (hour < 18) {
      greet = getTranslation(language, 'greeting.afternoon');
    } else {
      greet = getTranslation(language, 'greeting.evening');
    }
    setGreeting(greet);
  }, [language]);

  return (
    <div suppressHydrationWarning className='p-5 flex justify-between items-center border shadow-sm'>
      <div className='flex items-center gap-6'>
        <Image src='/logo-exfinit.png'
          alt="logo"
          width={160}
          height={100}
        />
        {isClient && isSignedIn && (
          <span className='text-lg font-semibold flex items-center gap-2'>
            <span role="img" aria-label="wave">👋</span>
            {greeting}, {user?.firstName || user?.lastName || 'User'}!
          </span>
        )}
      </div>
      {isClient && (
        <div className='flex items-center gap-2'>
          {isSignedIn ?
            <UserButton /> :
            <Link href={'/sign-up'}>
              <Button className='bg-amber-600 hover:bg-amber-700 cursor-pointer'>
                {getTranslation(language, 'landing.getStarted')}
              </Button>
            </Link>
          }
        </div>
      )}
    </div>
  )

}

export default Header