import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only protect admin routes, but exclude the login page to prevent redirect loops
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    // Check if admin is already authenticated via cookie
    const adminCookie = request.cookies.get(process.env.ADMIN_COOKIE_NAME!)
    
    // If cookie exists and is valid, allow access
    if (adminCookie?.value === 'authenticated') {
      return NextResponse.next()
    }

    // Check for password in query params (for easy admin access)
    const passwordFromQuery = request.nextUrl.searchParams.get('password')
    if (passwordFromQuery === process.env.ADMIN_PASSWORD) {
      const response = NextResponse.next()
      // Set authentication cookie for 24 hours
      response.cookies.set(process.env.ADMIN_COOKIE_NAME!, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: parseInt(process.env.ADMIN_SESSION_DURATION!) || 86400000 // 24 hours
      })
      return response
    }

    // If no valid auth, redirect to admin login
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
} 