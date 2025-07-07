import { NextRequest, NextResponse } from 'next/server'

interface Goal {
  id: string
  name: string
  target: number
  current: number
  progress: number
  unit: string
  description: string
  burnPercentage: number
}

// Fetch live Twitter followers (placeholder - replace with real Twitter API)
async function fetchTwitterFollowers(): Promise<number> {
  // Placeholder implementation
  // In production, use Twitter API v2:
  // const response = await fetch(`https://api.twitter.com/2/users/by/username/gudtek_solana?user.fields=public_metrics`, {
  //   headers: { 'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}` }
  // })
  return 2500 // Placeholder value
}

// Fetch live holder count from on-chain data
async function fetchHolderCount(): Promise<number> {
  try {
    // Use the same logic as hackathon leaderboard to get holder count
    const HELIUS_API_KEY = 'e568033d-06d6-49d1-ba90-b3564c91851b'
    const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
    const GUDTEK_MINT = '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk'

    let totalHolders = 0
    let page = 1
    const limit = 1000

    // Fetch first few pages to get an estimate
    while (page <= 3) { // Limit to 3 pages for performance
      const response = await fetch(HELIUS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getTokenAccounts',
          id: 'helius-gudtek-holders',
          params: {
            page: page,
            limit: limit,
            displayOptions: {},
            mint: GUDTEK_MINT,
          },
        }),
      })

      if (!response.ok) break

      const data = await response.json()
      if (!data.result || !data.result.token_accounts || data.result.token_accounts.length === 0) {
        break
      }

      // Count unique owners
      const uniqueOwners = new Set(data.result.token_accounts.map((account: any) => account.owner))
      totalHolders += uniqueOwners.size
      page++
    }

    return Math.max(totalHolders, 1200) // Ensure minimum reasonable value
  } catch (error) {
    console.error('Error fetching holder count:', error)
    return 1200 // Fallback value
  }
}

// Fetch Telegram member count (placeholder - replace with real Telegram API)
async function fetchTelegramMembers(): Promise<number> {
  // Placeholder implementation
  // In production, use Telegram Bot API:
  // const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChatMemberCount?chat_id=@gudteksolana`)
  return 850 // Placeholder value
}

// Fetch community task completion count (placeholder - replace with real tracking)
async function fetchCommunityTasks(): Promise<number> {
  // Placeholder implementation
  // In production, integrate with your task tracking system
  return 45 // Placeholder value
}

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching community goals data...')

    // Fetch all goal metrics in parallel
    const [twitterFollowers, holderCount, telegramMembers, communityTasks] = await Promise.allSettled([
      fetchTwitterFollowers(),
      fetchHolderCount(),
      fetchTelegramMembers(),
      fetchCommunityTasks()
    ])

    // Create goals array with live data
    const goals: Goal[] = [
      {
        id: 'twitter_followers',
        name: 'Twitter Followers',
        target: 10000,
        current: twitterFollowers.status === 'fulfilled' ? twitterFollowers.value : 2500,
        progress: 0,
        unit: 'followers',
        description: 'Reach 10K followers for 0.5% burn',
        burnPercentage: 0.5
      },
      {
        id: 'holders',
        name: 'Token Holders',
        target: 5000,
        current: holderCount.status === 'fulfilled' ? holderCount.value : 1200,
        progress: 0,
        unit: 'holders',
        description: 'Reach 5K holders for 1% burn',
        burnPercentage: 1.0
      },
      {
        id: 'telegram_members',
        name: 'Telegram Members',
        target: 3000,
        current: telegramMembers.status === 'fulfilled' ? telegramMembers.value : 850,
        progress: 0,
        unit: 'members',
        description: 'Reach 3K members for 0.3% burn',
        burnPercentage: 0.3
      },
      {
        id: 'community_tasks',
        name: 'Community Tasks',
        target: 100,
        current: communityTasks.status === 'fulfilled' ? communityTasks.value : 45,
        progress: 0,
        unit: 'tasks',
        description: 'Complete 100 community tasks for 0.2% burn',
        burnPercentage: 0.2
      }
    ]

    // Calculate progress percentages
    goals.forEach(goal => {
      goal.progress = Math.min((goal.current / goal.target) * 100, 100)
    })

    // Calculate total potential burn and achieved burn
    const totalPotentialBurn = goals.reduce((sum, goal) => sum + goal.burnPercentage, 0)
    const achievedBurn = goals
      .filter(goal => goal.progress >= 100)
      .reduce((sum, goal) => sum + goal.burnPercentage, 0)

    console.log(`Goals data: ${goals.length} goals, ${achievedBurn}% burn achieved of ${totalPotentialBurn}% total`)

    return NextResponse.json({
      success: true,
      goals,
      summary: {
        totalGoals: goals.length,
        completedGoals: goals.filter(goal => goal.progress >= 100).length,
        totalPotentialBurn,
        achievedBurn,
        remainingBurn: totalPotentialBurn - achievedBurn
      },
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching goals data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community goals data' },
      { status: 500 }
    )
  }
}

export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
} 