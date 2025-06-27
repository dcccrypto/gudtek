import { NextRequest, NextResponse } from 'next/server'
import { joinChessLobby } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { lobbyCode, walletAddress } = await request.json()

    if (!lobbyCode || !walletAddress) {
      return NextResponse.json({ error: 'Lobby code and wallet address are required' }, { status: 400 })
    }

    const lobby = await joinChessLobby(lobbyCode, walletAddress)

    return NextResponse.json({
      success: true,
      lobby
    })
  } catch (error: any) {
    console.error('Error joining lobby:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join lobby' },
      { status: 500 }
    )
  }
} 