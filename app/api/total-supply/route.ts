import { NextRequest, NextResponse } from 'next/server'

const HELIUS_API_KEY = 'e568033d-06d6-49d1-ba90-b3564c91851b'
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
const GUDTEK_MINT = '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk'

// Team wallet addresses with labels
const TEAM_WALLETS = [
  { address: 'DB4omYJ9ncPssq7w2Sdxbrv8tnUQHbUDCL9hgFgjgd4Q', label: 'Dev Wallet (Main)', isLocked: true },
  { address: '7bsrT959areHws9ezYFHF4uCxwYLVRGzjbdqZZNrdCwF', label: 'Team Wallet 2', isLocked: false },
  { address: 'FUt76P3GQ7Zkvd75RH1FhcfHbUWkXRdX4osXWZe8n9zK', label: 'Team Wallet 3', isLocked: false },
  { address: 'DskhuBJRSW5xL4SzUijpQU5fMLRfnw6hXfxJx2WPSnif', label: 'Team Wallet 4', isLocked: false },
  { address: 'kHERC1oef4TYVvvfzapN6u9HKgkvp8tKKeAqVyFiCPL', label: 'Team Wallet 8', isLocked: false },
  { address: '2PAMf5atKdhKg14GeYmj58iVRjhSSEHYRkFAJdAcFnQe', label: 'Team Wallet 9', isLocked: false }
]

// BONK-owned wallet with locked 7% supply
const BONK_WALLET = {
  address: 'HCGZE3Z3PkPR2kSGT8GweNigpg3ev7HhqQektseVCRPJ',
  label: 'BONK Holdings (Locked)',
  isLocked: true,
  expectedPercentage: 7
}

interface SupplyData {
  totalSupply: number
  circulatingSupply: number
  teamHoldings: {
    address: string
    balance: number
    percentage: number
    label: string
    isLocked: boolean
  }[]
  bonkHoldings: {
    address: string
    balance: number
    percentage: number
    label: string
    isLocked: boolean
  }
  totalTeamBalance: number
  totalTeamPercentage: number
  totalLockedSupply: number
  totalLockedPercentage: number
}

async function fetchTokenSupply(): Promise<number> {
  try {
    const response = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getTokenSupply',
        id: 'helius-total-supply',
        params: [GUDTEK_MINT],
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.result && data.result.value) {
      return data.result.value.uiAmount || 1000000000 // Fallback to 1B if no data
    }
    
    return 1000000000 // Default fallback
  } catch (error) {
    console.error('Error fetching token supply:', error)
    return 1000000000 // Default fallback
  }
}

async function fetchWalletBalance(address: string): Promise<number> {
  try {
    const response = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getTokenAccountsByOwner',
        id: 'helius-wallet-balance',
        params: [
          address,
          {
            mint: GUDTEK_MINT,
          },
          {
            encoding: 'jsonParsed',
          },
        ],
      }),
    })

    if (!response.ok) {
      return 0
    }

    const data = await response.json()
    
    if (data.result && data.result.value && data.result.value.length > 0) {
      let totalBalance = 0
      for (const account of data.result.value) {
        const balance = account.account.data.parsed.info.tokenAmount.uiAmount || 0
        totalBalance += balance
      }
      return totalBalance
    }
    
    return 0
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error)
    return 0
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching comprehensive supply data...')
    
    // Fetch total supply
    const totalSupply = await fetchTokenSupply()
    
    // Fetch all team wallet balances
    const teamBalancePromises = TEAM_WALLETS.map(async (wallet) => {
      const balance = await fetchWalletBalance(wallet.address)
      return {
        address: wallet.address,
        balance,
        percentage: (balance / totalSupply) * 100,
        label: wallet.label,
        isLocked: wallet.isLocked
      }
    })

    // Fetch BONK wallet balance
    const bonkBalance = await fetchWalletBalance(BONK_WALLET.address)
    const bonkHoldings = {
      address: BONK_WALLET.address,
      balance: bonkBalance,
      percentage: (bonkBalance / totalSupply) * 100,
      label: BONK_WALLET.label,
      isLocked: BONK_WALLET.isLocked
    }

    const teamHoldings = await Promise.all(teamBalancePromises)
    
    // Calculate totals
    const totalTeamBalance = teamHoldings.reduce((sum, wallet) => sum + wallet.balance, 0)
    const totalTeamPercentage = (totalTeamBalance / totalSupply) * 100
    
    // Calculate locked supply (BONK wallet + locked team wallets)
    const lockedTeamBalance = teamHoldings
      .filter(wallet => wallet.isLocked)
      .reduce((sum, wallet) => sum + wallet.balance, 0)
    const totalLockedSupply = bonkBalance + lockedTeamBalance
    const totalLockedPercentage = (totalLockedSupply / totalSupply) * 100
    
    const circulatingSupply = totalSupply - totalLockedSupply
    
    console.log(`Supply breakdown: Total=${totalSupply.toLocaleString()}, Team=${totalTeamBalance.toLocaleString()}, BONK Locked=${bonkBalance.toLocaleString()}, Circulating=${circulatingSupply.toLocaleString()}`)

    const supplyData: SupplyData = {
      totalSupply,
      circulatingSupply,
      teamHoldings,
      bonkHoldings,
      totalTeamBalance,
      totalTeamPercentage,
      totalLockedSupply,
      totalLockedPercentage
    }

    return NextResponse.json({
      success: true,
      data: supplyData,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching supply data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supply data' },
      { status: 500 }
    )
  }
}

export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
} 