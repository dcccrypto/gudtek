import { NextRequest, NextResponse } from 'next/server'
import { getAllAnnouncements } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Simple admin check (you should implement proper authentication)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== 'Bearer admin-token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const announcements = await getAllAnnouncements()

    return NextResponse.json({
      announcements: announcements
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
} 