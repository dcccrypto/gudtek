import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard, getUserRank } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Function to redact wallet address for privacy
function redactWalletAddress(walletAddress: string): string {
  if (!walletAddress || walletAddress.length < 8) {
    return 'Invalid Address'
  }
  
  // Show first 4 and last 4 characters with dots in between
  const start = walletAddress.slice(0, 4)
  const end = walletAddress.slice(-4)
  return `${start}...${end}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId')

    console.log('Leaderboard API called with limit:', limit, 'userId:', userId)

    // Get leaderboard with enhanced error handling
    const leaderboard = await getLeaderboard(limit)
    console.log('Raw leaderboard data:', leaderboard)

    if (!Array.isArray(leaderboard)) {
      console.error('Leaderboard data is not an array:', leaderboard)
      return NextResponse.json(
        { error: 'Invalid leaderboard data format' },
        { status: 500 }
      )
    }

    // Format leaderboard data with comprehensive field mapping
    const formattedLeaderboard = leaderboard.map((entry: any, index: number) => {
      // Defensive programming - handle different data structures
      const gameUser = entry.game_users || (Array.isArray(entry.game_users) ? entry.game_users[0] : null)
      
      // Use username if available, otherwise use redacted wallet address
      const displayName = entry.username || 
                          gameUser?.username || 
                          redactWalletAddress(entry.wallet_address || 'Unknown')
      
      const formattedEntry = {
        rank: index + 1,
        userId: entry.user_id,
        walletAddress: entry.wallet_address,
        username: displayName,
        highScore: entry.high_score || 0, // Best single game score
        totalScore: entry.total_score || 0, // Cumulative score across all games
        totalGames: entry.total_games || 0,
        totalTokens: entry.total_tokens_collected || 0,
        isVerified: gameUser?.is_verified || false,
        lastUpdated: entry.updated_at
      }
      
      console.log('Formatted entry:', formattedEntry)
      return formattedEntry
    })

    // Get user rank if userId provided
    let userRank = null
    if (userId) {
      try {
        userRank = await getUserRank(userId)
        console.log('User rank data:', userRank)
      } catch (rankError) {
        console.error('Error fetching user rank:', rankError)
        // Don't fail the entire request for rank error
      }
    }

    const response = {
      success: true,
      leaderboard: formattedLeaderboard,
      userRank: userRank ? {
        rank: userRank.rank_position || null,
        highScore: userRank.high_score || 0,
        totalScore: userRank.total_score || 0
      } : null,
      total: formattedLeaderboard.length,
      timestamp: new Date().toISOString()
    }

    console.log('Leaderboard API response:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Critical error in leaderboard API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch leaderboard',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
} 