import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'

const HELIUS_API_KEY = 'e568033d-06d6-49d1-ba90-b3564c91851b'
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
const GUDTEK_MINT = '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk'
const BURN_ADDRESS = '11111111111111111111111111111111'

// Team wallet addresses (deduplicated, removed wallets 5, 6, 7)
const TEAM_WALLETS = [
  'DB4omYJ9ncPssq7w2Sdxbrv8tnUQHbUDCL9hgFgjgd4Q', // Gud Tek Wallet 1
  '7bsrT959areHws9ezYFHF4uCxwYLVRGzjbdqZZNrdCwF', // Gud Tek Wallet 2
  'FUt76P3GQ7Zkvd75RH1FhcfHbUWkXRdX4osXWZe8n9zK', // Gud Tek Wallet 3
  'DskhuBJRSW5xL4SzUijpQU5fMLRfnw6hXfxJx2WPSnif', // Gud Tek Wallet 4
  'kHERC1oef4TYVvvfzapN6u9HKgkvp8tKKeAqVyFiCPL', // Gud Tek Wallet 8
  '2PAMf5atKdhKg14GeYmj58iVRjhSSEHYRkFAJdAcFnQe'  // Gud Tek Wallet 9
]

interface WalletBalance {
  address: string
  balance: number
  percentage: number
  label: string
}

async function fetchWalletBalance(address: string): Promise<number> {
  try {
    const connection = new Connection(HELIUS_URL, 'confirmed')
    const publicKey = new PublicKey(address)
    
    // Get token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        mint: new PublicKey(GUDTEK_MINT),
      },
      'confirmed'
    )

    if (tokenAccounts.value.length === 0) {
      return 0
    }

    // Sum up balances from all token accounts
    let totalBalance = 0
    for (const account of tokenAccounts.value) {
      const balance = account.account.data.parsed.info.tokenAmount.uiAmount || 0
      totalBalance += balance
    }

    return totalBalance
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error)
    return 0
  }
}

async function calculateTeamBurnedTokens(): Promise<number> {
  // For now, return a placeholder value
  // In a real implementation, you would:
  // 1. Track initial allocations to team wallets
  // 2. Sum all burn transactions from these wallets
  // 3. Or calculate difference from known initial amounts
  
  // Placeholder: assume 50M tokens were initially allocated to team
  // and calculate burned as difference from current holdings
  const INITIAL_TEAM_ALLOCATION = 50000000 // 50M tokens
  
  try {
    const balances = await Promise.allSettled(
      TEAM_WALLETS.map(address => fetchWalletBalance(address))
    )
    
    const totalCurrentBalance = balances
      .filter((result): result is PromiseFulfilledResult<number> => result.status === 'fulfilled')
      .reduce((sum, result) => sum + result.value, 0)
    
    // Calculate burned as difference from initial allocation
    const burnedAmount = Math.max(0, INITIAL_TEAM_ALLOCATION - totalCurrentBalance)
    return burnedAmount
  } catch (error) {
    console.error('Error calculating burned tokens:', error)
    return 0
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching team wallet stats...')
    
    // Fetch all team wallet balances
    const balancePromises = TEAM_WALLETS.map(async (address, index) => {
      const balance = await fetchWalletBalance(address)
      return {
        address,
        balance,
        percentage: (balance / 1000000000) * 100, // Percentage of 1B total supply
        label: `Gud Tek Wallet ${index + 1}`
      }
    })

    const walletBalances = await Promise.all(balancePromises)
    
    // Calculate totals
    const totalTeamHeld = walletBalances.reduce((sum, wallet) => sum + wallet.balance, 0)
    const totalTeamBurned = await calculateTeamBurnedTokens()
    
    console.log(`Team stats: Held=${totalTeamHeld.toLocaleString()}, Burned=${totalTeamBurned.toLocaleString()}`)

    return NextResponse.json({
      success: true,
      wallets: walletBalances,
      totals: {
        totalTeamHeld,
        totalTeamBurned,
        totalTeamAllocated: totalTeamHeld + totalTeamBurned,
        percentageHeld: (totalTeamHeld / (totalTeamHeld + totalTeamBurned)) * 100,
        percentageBurned: (totalTeamBurned / (totalTeamHeld + totalTeamBurned)) * 100
      },
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching team stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team wallet stats' },
      { status: 500 }
    )
  }
}

export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
} 