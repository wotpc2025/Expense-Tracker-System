/**
 * admin/layout.jsx — Admin Section Server-Side Guard
 *
 * Route guard for ALL /dashboard/admin/** routes.
 * Runs entirely on the server (Server Component — no 'use client').
 *
 * Security chain:
 *   1. Clerk's currentUser() fetches the fully-verified user from the server.
 *   2. isAdminUser() checks BOTH role metadata AND the ADMIN_EMAILS allowlist.
 *   3. If either check fails, the user is hard-redirected to /dashboard.
 *
 * This double-check means even if the client-side admin flag is somehow
 * spoofed, the server will still block unauthenticated access.
 */
import React from 'react'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { isAdminUser } from '@/lib/adminAccess'

export default async function AdminLayout({ children }) {
  const user = await currentUser()
  const isAdmin = isAdminUser(user, process.env.ADMIN_EMAILS)

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
