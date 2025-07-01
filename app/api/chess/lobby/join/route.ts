import { NextRequest, NextResponse } from 'next/server'
import { joinChessLobby } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { lobbyCode, walletAddress } = await request.json()

    if (!lobbyCode || !walletAddress) {
      return NextResponse.json({ error: 'Lobby code and wallet address are required' }, { status: 400 })
    }

    const result = await joinChessLobby(lobbyCode, walletAddress)

    // Handle different response formats from the updated joinChessLobby function
    if (result.gameData) {
      // Game has already started or was auto-started
      return NextResponse.json({
        success: true,
        lobby: result.lobby,
        gameData: result.gameData,
        autoStarted: result.autoStarted || false
      })
    } else if (result.lobby) {
      // Still in lobby phase
      return NextResponse.json({
        success: true,
        lobby: result.lobby
      })
    } else {
      // Fallback for older response format
      return NextResponse.json({
        success: true,
        lobby: result
      })
    }
  } catch (error: any) {
    console.error('Error joining lobby:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join lobby' },
      { status: 500 }
    )
  }
} 