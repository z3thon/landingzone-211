import { NextResponse, type NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

/**
 * Middleware to check Discord session authentication
 * Uses custom JWT session management instead of Supabase Auth
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  // Allow public access to home page, auth pages, and public API routes
  const pathname = request.nextUrl.pathname
  
  // Always allow API routes, auth routes, static files, and public pages
  const isPublicPath = 
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    (pathname.startsWith('/projects') && !pathname.startsWith('/projects/new')) ||
    pathname.startsWith('/profiles') ||
    pathname.startsWith('/search')

  // Check for session cookie
  const sessionCookie = request.cookies.get('session')
  
  let user = null
  if (sessionCookie?.value) {
    try {
      const session = await decrypt(sessionCookie.value)
      // Check if session is expired
      if (session && new Date(session.expiresAt) > new Date()) {
        user = { id: session.userId }
      }
    } catch (error) {
      // Invalid session, treat as not authenticated
      console.error('Session decryption error in middleware:', error)
    }
  }

  // Only redirect to login if user is not authenticated and trying to access protected route
  // IMPORTANT: Don't redirect if already on auth pages to prevent loops
  if (!user && !isPublicPath && !pathname.startsWith('/auth')) {
    // no user, redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return response
}

