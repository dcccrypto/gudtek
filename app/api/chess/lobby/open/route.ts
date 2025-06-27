import { NextRequest, NextResponse } from 'next/server'
import { getOpenLobbies } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Use URL constructor with a base URL to avoid dynamic server usage
    const url = new URL(request.url || '', 'http://localhost')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const lobbies = await getOpenLobbies(limit)

    return NextResponse.json({
      success: true,
      lobbies
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
  } catch (error: any) {
    console.error('Error fetching open lobbies:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch open lobbies' },
      { status: 500 }
    )
  }
} 