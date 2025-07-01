import { NextRequest, NextResponse } from 'next/server'

const HELIUS_API_KEY = 'e568033d-06d6-49d1-ba90-b3564c91851b'
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
const GUDTEK_MINT = '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk'

interface TokenAccount {
  address: string
  mint: string
  owner: string
  amount: number
  delegated_amount: number
  frozen: boolean
}

interface TokenHolder {
  address: string
  balance: number
  rank: number
  first_prize: number
  second_prize: number
  third_prize: number
  balance_percentage: number
}

// Total hackathon prize pools
const TOTAL_HACKATHON_PRIZES = {
  first: 140000,  // 140k total for 1st place
  second: 50000,  // 50k total for 2nd place  
  third: 10000    // 10k total for 3rd place
}

// 25% of each prize pool is divided among top 100 holders
const HACKATHON_PRIZES = {
  first: TOTAL_HACKATHON_PRIZES.first * 0.25,   // 35k total divided among top 100
  second: TOTAL_HACKATHON_PRIZES.second * 0.25, // 12.5k total divided among top 100
  third: TOTAL_HACKATHON_PRIZES.third * 0.25    // 2.5k total divided among top 100
}

async function fetchTokenHolders(): Promise<TokenAccount[]> {
  const allTokenAccounts: TokenAccount[] = []
  let page = 1
  const limit = 1000

  try {
    while (true) {
      console.log(`Fetching page ${page} of token holders...`)
      
      const response = await fetch(HELIUS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} ${response.statusText}`)
        break
      }

      const data = await response.json()

      if (!data.result || !data.result.token_accounts || data.result.token_accounts.length === 0) {
        console.log(`No more results found. Total pages processed: ${page - 1}`)
        break
      }

      console.log(`Page ${page}: Found ${data.result.token_accounts.length} token accounts`)
      allTokenAccounts.push(...data.result.token_accounts)
      
      page++

      // Safety break to prevent infinite loops
      if (page > 1000) {
        console.warn('Hit maximum page limit (1000), breaking loop')
        break
      }
    }

    console.log(`Total token accounts fetched: ${allTokenAccounts.length}`)
    return allTokenAccounts

  } catch (error) {
    console.error('Error fetching token holders:', error)
    throw error
  }
}

function consolidateHolders(tokenAccounts: TokenAccount[]): Map<string, number> {
  const holdersMap = new Map<string, number>()

  for (const account of tokenAccounts) {
    const owner = account.owner
    const balance = account.amount / Math.pow(10, 6) // Convert from raw amount (assuming 6 decimals)

    if (holdersMap.has(owner)) {
      holdersMap.set(owner, holdersMap.get(owner)! + balance)
    } else {
      holdersMap.set(owner, balance)
    }
  }

  return holdersMap
}

function calculateProportionatePrizes(balance: number, totalTop100Balance: number): { first: number, second: number, third: number, percentage: number } {
  // Calculate the percentage of total tokens held by this holder within the top 100
  const percentage = totalTop100Balance > 0 ? (balance / totalTop100Balance) : 0

  // Prize distribution: Proportionate to holdings within top 100
  // Each holder gets their percentage share of each prize pool
  return {
    first: HACKATHON_PRIZES.first * percentage,   // Share of $35K based on holdings
    second: HACKATHON_PRIZES.second * percentage, // Share of $12.5K based on holdings
    third: HACKATHON_PRIZES.third * percentage,   // Share of $2.5K based on holdings
    percentage: percentage * 100 // Convert to percentage for display
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Starting token holders fetch...')
    
    // Get all token accounts for GUDTEK
    const tokenAccounts = await fetchTokenHolders()
    
    if (tokenAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No token holders found' },
        { status: 404 }
      )
    }

    // Consolidate holdings by owner (in case one owner has multiple token accounts)
    const holdersMap = consolidateHolders(tokenAccounts)
    
    // Convert to array and sort by balance
    const allSortedHolders = Array.from(holdersMap.entries())
      .map(([address, balance]) => ({ address, balance }))
      .sort((a, b) => b.balance - a.balance)

    // Skip the first holder (liquidity pool) and get the next 100 holders
    const sortedHolders = allSortedHolders.slice(1, 101) // Skip index 0, take indices 1-100
    
    console.log(`Skipped liquidity pool holder with ${allSortedHolders[0]?.balance.toLocaleString()} GUDTEK`)
    console.log(`Top eligible holder has ${sortedHolders[0]?.balance.toLocaleString()} GUDTEK`)

    // Calculate total balance of top 100 eligible holders for proportionate distribution
    const totalTop100Balance = sortedHolders.reduce((sum, holder) => sum + holder.balance, 0)
    
    console.log(`Total balance of top 100 eligible holders: ${totalTop100Balance.toLocaleString()} GUDTEK`)

    // Add ranking and proportionate prize calculations
    const leaderboard: TokenHolder[] = sortedHolders.map((holder, index) => {
      const rank = index + 1 // Start ranking from 1 for the eligible holders
      const prizes = calculateProportionatePrizes(holder.balance, totalTop100Balance)
      
      return {
        address: holder.address,
        balance: holder.balance,
        rank: rank,
        first_prize: Math.round(prizes.first * 100) / 100, // Round to 2 decimal places
        second_prize: Math.round(prizes.second * 100) / 100,
        third_prize: Math.round(prizes.third * 100) / 100,
        balance_percentage: Math.round(prizes.percentage * 100) / 100
      }
    })

    console.log(`Successfully processed ${leaderboard.length} eligible holders with proportionate prize distribution`)

    // Calculate verification totals to ensure we're distributing the full prize pools
    const totalFirstPrizes = leaderboard.reduce((sum, holder) => sum + holder.first_prize, 0)
    const totalSecondPrizes = leaderboard.reduce((sum, holder) => sum + holder.second_prize, 0)
    const totalThirdPrizes = leaderboard.reduce((sum, holder) => sum + holder.third_prize, 0)
    
    console.log(`Prize distribution verification:`)
    console.log(`First place prizes total: $${totalFirstPrizes.toLocaleString()} (expected: $${HACKATHON_PRIZES.first.toLocaleString()})`)
    console.log(`Second place prizes total: $${totalSecondPrizes.toLocaleString()} (expected: $${HACKATHON_PRIZES.second.toLocaleString()})`)
    console.log(`Third place prizes total: $${totalThirdPrizes.toLocaleString()} (expected: $${HACKATHON_PRIZES.third.toLocaleString()})`)

    return NextResponse.json({
      success: true,
      total_holders: holdersMap.size,
      total_eligible_holders: holdersMap.size - 1, // Subtract 1 for the liquidity pool
      liquidity_pool_excluded: true,
      liquidity_pool_balance: allSortedHolders[0]?.balance || 0,
      top_100: leaderboard,
      total_top_100_balance: totalTop100Balance,
      last_updated: new Date().toISOString(),
      prizes: {
        total_pools: TOTAL_HACKATHON_PRIZES,
        distribution_pools: HACKATHON_PRIZES,
        distribution_method: 'proportionate_to_holdings'
      },
      prize_verification: {
        total_first_distributed: Math.round(totalFirstPrizes * 100) / 100,
        total_second_distributed: Math.round(totalSecondPrizes * 100) / 100,
        total_third_distributed: Math.round(totalThirdPrizes * 100) / 100
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch token holders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Add caching headers for better performance
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    },
  })
} 