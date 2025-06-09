import { NextRequest, NextResponse } from 'next/server'
import { getGameStats } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const stats = await getGameStats()
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching game stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game stats' },
      { status: 500 }
    )
  }
} 