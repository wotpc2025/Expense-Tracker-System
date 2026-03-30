"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useUser,UserButton } from '@clerk/nextjs'
import Link from 'next/link'

function Header() {

  const { user, isSignedIn } = useUser();
  const [isClient, setIsClient] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setIsClient(true);
    // Set greeting based on time
    const hour = new Date().getHours();
    let greet = '';
    if (hour < 12) {
      greet = 'Good morning';
    } else if (hour < 18) {
      greet = 'Good afternoon';
    } else {
      greet = 'Good evening';
    }
    setGreeting(greet);
  }, []);

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
      {isClient && (isSignedIn ?
        <UserButton /> :
        <Link href={'/sign-up'}>
          <Button className='bg-amber-600 hover:bg-amber-700 cursor-pointer'>
            Get Started
          </Button>
        </Link>
      )}
    </div>
  )

}

export default Header