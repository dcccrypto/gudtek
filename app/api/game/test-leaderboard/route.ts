import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard, getUserRank, refreshLeaderboardRanks } from '@/lib/supabase'

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
    const action = searchParams.get('action') || 'leaderboard'
    const userId = searchParams.get('userId')

    switch (action) {
      case 'leaderboard':
        const leaderboard = await getLeaderboard(10)
        
        // Format leaderboard data with redacted addresses
        const formattedLeaderboard = leaderboard.map((entry: any, index: number) => {
          const displayName = entry.username || 
                              entry.game_users?.username || 
                              redactWalletAddress(entry.wallet_address)
          
          return {
            rank: index + 1,
            userId: entry.user_id,
            walletAddress: entry.wallet_address,
            username: displayName,
            highScore: entry.high_score,
            totalScore: entry.total_score,
            totalGames: entry.total_games,
            totalTokens: entry.total_tokens_collected,
            isVerified: entry.game_users?.is_verified || false
          }
        })
        
        return NextResponse.json({
          success: true,
          action: 'leaderboard',
          data: formattedLeaderboard,
          count: formattedLeaderboard.length
        })

      case 'userRank':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required for userRank action' },
            { status: 400 }
          )
        }
        const userRank = await getUserRank(userId)
        return NextResponse.json({
          success: true,
          action: 'userRank',
          data: userRank
        })

      case 'refreshRanks':
        await refreshLeaderboardRanks()
        return NextResponse.json({
          success: true,
          action: 'refreshRanks',
          message: 'Ranks refreshed successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: leaderboard, userRank, or refreshRanks' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in test leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 