import React from 'react'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/adminAccess'

export default async function AdminLayout({ children }) {
  const user = await currentUser()
  const isAdmin = isAdminUser(user, process.env.ADMIN_EMAILS)

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
