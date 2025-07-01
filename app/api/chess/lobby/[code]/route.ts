// This file should be moved to app/api/chess/lobby/[code]/status/route.ts
// But since we can't move files, I'll update the frontend to use the correct path

import { NextRequest, NextResponse } from 'next/server'
import { checkLobbyStatus, getLobby } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    
    // Check if this is a status check request
    if (walletAddress) {
      const result = await checkLobbyStatus(params.code, walletAddress)
      
      if (!result) {
        return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        ...result
      })
    } else {
      // Fallback to simple lobby fetch for other uses
      const lobby = await getLobby(params.code)
      
      if (!lobby) {
        return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        lobby
      })
    }
  } catch (error: any) {
    console.error('Error checking lobby:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check lobby' },
      { status: 500 }
    )
  }
} 