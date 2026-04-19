import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// This file acts as route-level access control at the edge/runtime boundary.
// Public routes are reachable without auth; everything else requires Clerk session.

// Routes that do not require authentication.
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)', 
  '/sign-up(.*)'
])

// Protect all non-public routes via Clerk middleware.
export default clerkMiddleware(async (auth, req) => {
  // auth.protect() redirects unauthenticated users to the configured sign-in flow.
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

// Control which paths middleware runs on.
export const config = {
  matcher: [
    // Skip Next.js internals and static assets for performance.
    // Keep dynamic pages and app routes protected by middleware.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes to enforce auth consistently.
    '/(api|trpc)(.*)',
  ],
}