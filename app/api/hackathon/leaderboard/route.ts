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

function calculatePrizes(rank: number): { first: number, second: number, third: number } {
  // Only top 100 holders get prizes
  if (rank > 100) {
    return { first: 0, second: 0, third: 0 }
  }

  // Prize distribution: Equal split among all top 100 holders
  // Each holder gets exactly 1/100th of each prize pool
  return {
    first: HACKATHON_PRIZES.first / 100,   // $35K / 100 = $350 each
    second: HACKATHON_PRIZES.second / 100, // $12.5K / 100 = $125 each  
    third: HACKATHON_PRIZES.third / 100    // $2.5K / 100 = $25 each
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
    const sortedHolders = Array.from(holdersMap.entries())
      .map(([address, balance]) => ({ address, balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 100) // Get top 100

    // Add ranking and prize calculations
    const leaderboard: TokenHolder[] = sortedHolders.map((holder, index) => {
      const rank = index + 1
      const prizes = calculatePrizes(rank)
      
      return {
        address: holder.address,
        balance: holder.balance,
        rank: rank,
        first_prize: prizes.first,
        second_prize: prizes.second,
        third_prize: prizes.third,
      }
    })

    console.log(`Successfully processed ${leaderboard.length} holders`)

    return NextResponse.json({
      success: true,
      total_holders: holdersMap.size,
      top_100: leaderboard,
      last_updated: new Date().toISOString(),
      prizes: {
        total_pools: TOTAL_HACKATHON_PRIZES,
        distribution_pools: HACKATHON_PRIZES
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