import { NextRequest, NextResponse } from 'next/server'
import { getLobby } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    if (!code) {
      return NextResponse.json({ error: 'Lobby code is required' }, { status: 400 })
    }

    const lobby = await getLobby(code)

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      lobby
    })
  } catch (error: any) {
    console.error('Error fetching lobby:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lobby' },
      { status: 500 }
    )
  }
} 