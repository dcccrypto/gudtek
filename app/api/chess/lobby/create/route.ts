import { NextRequest, NextResponse } from 'next/server'
import { createChessLobby } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { hostWallet, lobbyType, allowedWallets, timeControl, increment } = await request.json()

    if (!hostWallet) {
      return NextResponse.json({ error: 'Host wallet is required' }, { status: 400 })
    }

    if (!['open', 'private'].includes(lobbyType)) {
      return NextResponse.json({ error: 'Invalid lobby type' }, { status: 400 })
    }

    const lobby = await createChessLobby({
      hostWallet,
      lobbyType,
      allowedWallets: allowedWallets || [],
      timeControl: timeControl || 600,
      increment: increment || 0
    })

    return NextResponse.json({
      success: true,
      lobby,
      inviteLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gudtek.club'}/chess?lobby=${lobby.lobby_code}`
    })
  } catch (error: any) {
    console.error('Error creating lobby:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create lobby' },
      { status: 500 }
    )
  }
} 