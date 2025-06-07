// Enhanced wallet connection utility with accurate balance checking
// Uses premium Helius RPC and improved wallet adapters

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'

// $GUDTEK Token Contract Address on Solana Mainnet
export const GUDTEK_TOKEN_MINT = new PublicKey('5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk')

// Minimum balance required for voting/submitting (in token units)
export const MIN_GUDTEK_BALANCE = 1000 // 1000 $GUDTEK tokens minimum

export interface WalletState {
  connected: boolean
  publicKey: string | null
  balance: number
  solBalance: number
}

// Premium Helius RPC endpoint for better performance and reliability
const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=e568033d-06d6-49d1-ba90-b3564c91851b'

// Create connection to Solana mainnet with premium Helius RPC
const connection = new Connection(
  HELIUS_RPC_URL,
  {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
    wsEndpoint: HELIUS_RPC_URL.replace('https://', 'wss://').replace('http://', 'ws://'),
  }
)

/**
 * Check if we're in a browser environment to prevent hydration errors
 */
const isBrowser = () => typeof window !== 'undefined'

/**
 * Get $GUDTEK token balance for a wallet address with improved accuracy
 */
export const getGudtekBalance = async (walletAddress: string): Promise<number> => {
  if (!isBrowser()) {
    console.log('Server-side rendering detected, returning 0 balance to prevent hydration errors')
    return 0
  }

  try {
    console.log(`Fetching $GUDTEK balance for wallet: ${walletAddress}`)
    const publicKey = new PublicKey(walletAddress)
    
    // Use Helius-enhanced getParsedTokenAccountsByOwner for better reliability
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        mint: GUDTEK_TOKEN_MINT,
      },
      'confirmed' // Use confirmed commitment for faster responses
    )

    console.log(`Found ${tokenAccounts.value.length} $GUDTEK token accounts`)

    if (tokenAccounts.value.length === 0) {
      console.log('No $GUDTEK token accounts found, balance is 0')
      return 0
    }

    // Sum up balances from all token accounts (usually there's just one)
    let totalBalance = 0
    for (const account of tokenAccounts.value) {
      const balance = account.account.data.parsed.info.tokenAmount.uiAmount || 0
      totalBalance += balance
      console.log(`Token account balance: ${balance}`)
    }

    console.log(`Total $GUDTEK balance: ${totalBalance}`)
    return totalBalance

  } catch (error) {
    console.error('Error getting $GUDTEK balance:', error)
    
    // Enhanced fallback with better error handling
    try {
      console.log('Attempting fallback balance check...')
      const publicKey = new PublicKey(walletAddress)
      
      // Get the associated token account address for $GUDTEK
      const tokenAccountAddress = await getAssociatedTokenAddress(
        GUDTEK_TOKEN_MINT,
        publicKey
      )

      try {
        // Get the token account info
        const tokenAccount = await getAccount(connection, tokenAccountAddress)
        
        // Return the balance (convert from raw amount to tokens with proper decimals)
        // $GUDTEK likely has 6 decimals (common for Solana tokens)
        const balance = Number(tokenAccount.amount) / Math.pow(10, 6)
        console.log(`Fallback method balance: ${balance}`)
        return balance
      } catch (innerError) {
        // If token account doesn't exist, user has 0 balance
        console.log('Token account not found in fallback, balance is 0')
        return 0
      }
    } catch (fallbackError) {
      console.error('Fallback balance check also failed:', fallbackError)
      return 0
    }
  }
}

/**
 * Get SOL balance for a wallet address with improved accuracy
 */
export const getSolBalance = async (walletAddress: string): Promise<number> => {
  if (!isBrowser()) {
    console.log('Server-side rendering detected, returning 0 SOL balance to prevent hydration errors')
    return 0
  }

  try {
    console.log(`Fetching SOL balance for wallet: ${walletAddress}`)
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey, 'confirmed')
    const solBalance = balance / 1e9 // Convert lamports to SOL
    console.log(`SOL balance: ${solBalance}`)
    return solBalance
  } catch (error) {
    console.error('Error getting SOL balance:', error)
    return 0
  }
}

/**
 * Check if wallet has sufficient $GUDTEK tokens for voting/submitting
 */
export const checkVotingEligibility = async (walletAddress: string): Promise<boolean> => {
  if (!isBrowser()) {
    return false
  }

  try {
    const balance = await getGudtekBalance(walletAddress)
    const eligible = balance >= MIN_GUDTEK_BALANCE
    console.log(`Voting eligibility check: balance=${balance}, required=${MIN_GUDTEK_BALANCE}, eligible=${eligible}`)
    return eligible
  } catch (error) {
    console.error('Error checking voting eligibility:', error)
    return false
  }
}

/**
 * Check if wallet has sufficient $GUDTEK tokens for submitting memes
 */
export const checkSubmissionEligibility = async (walletAddress: string): Promise<boolean> => {
  if (!isBrowser()) {
    return false
  }

  try {
    const balance = await getGudtekBalance(walletAddress)
    const required = MIN_GUDTEK_BALANCE * 2 // 2000 $GUDTEK for submissions
    const eligible = balance >= required
    console.log(`Submission eligibility check: balance=${balance}, required=${required}, eligible=${eligible}`)
    return eligible
  } catch (error) {
    console.error('Error checking submission eligibility:', error)
    return false
  }
}

/**
 * Get comprehensive wallet information with retry logic and hydration-safe defaults
 */
export const getWalletInfo = async (walletAddress: string): Promise<{
  gudtekBalance: number
  solBalance: number
  canVote: boolean
  canSubmit: boolean
}> => {
  // Return safe defaults during SSR to prevent hydration errors
  if (!isBrowser()) {
    console.log('Server-side rendering detected, returning safe defaults')
    return {
      gudtekBalance: 0,
      solBalance: 0,
      canVote: false,
      canSubmit: false
    }
  }

  try {
    console.log(`Getting comprehensive wallet info for: ${walletAddress}`)
    
    // Use Promise.allSettled to ensure we get partial results even if one fails
    const results = await Promise.allSettled([
      getGudtekBalance(walletAddress),
      getSolBalance(walletAddress)
    ])

    const gudtekBalance = results[0].status === 'fulfilled' ? results[0].value : 0
    const solBalance = results[1].status === 'fulfilled' ? results[1].value : 0

    const canVote = gudtekBalance >= MIN_GUDTEK_BALANCE
    const canSubmit = gudtekBalance >= MIN_GUDTEK_BALANCE * 2

    console.log(`Wallet info summary: GUDTEK=${gudtekBalance}, SOL=${solBalance}, canVote=${canVote}, canSubmit=${canSubmit}`)

    return {
      gudtekBalance,
      solBalance,
      canVote,
      canSubmit
    }
  } catch (error) {
    console.error('Error getting wallet info:', error)
    return {
      gudtekBalance: 0,
      solBalance: 0,
      canVote: false,
      canSubmit: false
    }
  }
}

/**
 * Format token balance for display with better precision
 */
export const formatTokenBalance = (balance: number): string => {
  if (balance === 0) return '0'
  if (balance < 0.01) return balance.toFixed(6)
  if (balance < 1) return balance.toFixed(4)
  if (balance < 100) return balance.toFixed(2)
  if (balance < 1000) return balance.toFixed(1)
  if (balance < 1000000) return `${(balance / 1000).toFixed(1)}K`
  return `${(balance / 1000000).toFixed(1)}M`
}

/**
 * Format SOL balance for display
 */
export const formatSolBalance = (balance: number): string => {
  if (balance === 0) return '0'
  if (balance < 0.001) return '< 0.001'
  if (balance < 0.01) return balance.toFixed(4)
  return balance.toFixed(3)
}

/**
 * Validate wallet address format
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Test connection to Helius RPC
 */
export const testConnection = async (): Promise<boolean> => {
  if (!isBrowser()) {
    return false
  }

  try {
    const slot = await connection.getSlot()
    console.log(`Connected to Helius RPC, current slot: ${slot}`)
    return true
  } catch (error) {
    console.error('Failed to connect to Helius RPC:', error)
    return false
  }
} 