import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Verify admin password
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create response with authentication cookie
    const response = NextResponse.json({ success: true })
    
    // Set secure authentication cookie
    response.cookies.set(process.env.ADMIN_COOKIE_NAME!, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.ADMIN_SESSION_DURATION!) || 86400000, // 24 hours
      path: '/'
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Logout endpoint
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  
  // Clear authentication cookie
  response.cookies.delete(process.env.ADMIN_COOKIE_NAME!)
  
  return response
} 