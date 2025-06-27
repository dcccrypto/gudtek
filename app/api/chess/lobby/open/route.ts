import { NextRequest, NextResponse } from 'next/server'
import { getOpenLobbies } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const lobbies = await getOpenLobbies(limit)

    return NextResponse.json({
      success: true,
      lobbies
    })
  } catch (error: any) {
    console.error('Error fetching open lobbies:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch open lobbies' },
      { status: 500 }
    )
  }
} 