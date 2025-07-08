// Team wallet addresses with deduplication (removed wallets 5, 6, 7)
const RAW_TEAM_WALLETS = [
  'DB4omYJ9ncPssq7w2Sdxbrv8tnUQHbUDCL9hgFgjgd4Q', // Wallet 1
  '7bsrT959areHws9ezYFHF4uCxwYLVRGzjbdqZZNrdCwF', // Wallet 2
  'FUt76P3GQ7Zkvd75RH1FhcfHbUWkXRdX4osXWZe8n9zK', // Wallet 3
  'DskhuBJRSW5xL4SzUijpQU5fMLRfnw6hXfxJx2WPSnif', // Wallet 4
  'kHERC1oef4TYVvvfzapN6u9HKgkvp8tKKeAqVyFiCPL', // Wallet 8
  '2PAMf5atKdhKg14GeYmj58iVRjhSSEHYRkFAJdAcFnQe'  // Wallet 9
]

// BONK-owned wallet with locked 7% supply
export const BONK_LOCKED_WALLET = 'HCGZE3Z3PkPR2kSGT8GweNigpg3ev7HhqQektseVCRPJ'

/**
 * Deduplicate team wallet addresses
 * Removes duplicate wallet addresses from the provided list
 */
export function deduplicateWallets(wallets: string[]): string[] {
  return [...new Set(wallets)]
}

/**
 * Get deduplicated team wallet addresses
 */
export const TEAM_WALLETS = deduplicateWallets(RAW_TEAM_WALLETS)

/**
 * Constants for tokenomics calculations
 */
export const TOKENOMICS_CONSTANTS = {
  TOTAL_SUPPLY: 1_000_000_000, // 1 billion GUDTEK
  BURN_ADDRESS: '11111111111111111111111111111111',
  GUDTEK_MINT: '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk',
  
  // Market cap burn thresholds
  MARKET_CAP_BURN: {
    START_THRESHOLD: 100_000, // $100K
    END_THRESHOLD: 1_000_000,  // $1M
    INCREMENT: 100_000,        // $100K increments
    BURN_PERCENTAGE: 0.5,      // 0.5% burn per threshold (changed from 1%)
    SUSTAINED_HOURS: 24        // Must be sustained for 24 hours
  },

  // Initial team allocation for burn calculations
  INITIAL_TEAM_ALLOCATION: 50_000_000 // 50M tokens (5% of total supply)
}

/**
 * Format token amounts for display
 */
export function formatTokenAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`
  }
  return amount.toFixed(0)
}

/**
 * Calculate percentage of total supply
 */
export function calculateSupplyPercentage(amount: number): number {
  return (amount / TOKENOMICS_CONSTANTS.TOTAL_SUPPLY) * 100
}

/**
 * Generate market cap burn thresholds
 */
export function generateBurnThresholds() {
  const thresholds = []
  const { START_THRESHOLD, END_THRESHOLD, INCREMENT, BURN_PERCENTAGE } = TOKENOMICS_CONSTANTS.MARKET_CAP_BURN
  
  for (let threshold = START_THRESHOLD; threshold <= END_THRESHOLD; threshold += INCREMENT) {
    thresholds.push({
      marketCap: threshold,
      burnPercentage: BURN_PERCENTAGE,
      burnAmount: (TOKENOMICS_CONSTANTS.TOTAL_SUPPLY * BURN_PERCENTAGE) / 100
    })
  }
  
  return thresholds
}

/**
 * Check if market cap qualifies for burn
 */
export function checkBurnEligibility(currentMarketCap: number, timeAboveThreshold: number): {
  eligible: boolean
  nextThreshold: number | null
  sustainedHours: number
} {
  const { START_THRESHOLD, INCREMENT, SUSTAINED_HOURS } = TOKENOMICS_CONSTANTS.MARKET_CAP_BURN
  
  // Find the highest threshold we've crossed
  const crossedThreshold = Math.floor(currentMarketCap / INCREMENT) * INCREMENT
  const nextThreshold = crossedThreshold + INCREMENT
  
  return {
    eligible: currentMarketCap >= START_THRESHOLD && timeAboveThreshold >= SUSTAINED_HOURS,
    nextThreshold: nextThreshold <= TOKENOMICS_CONSTANTS.MARKET_CAP_BURN.END_THRESHOLD ? nextThreshold : null,
    sustainedHours: timeAboveThreshold
  }
}

/**
 * Example data for testing (replace with real API calls)
 */
export const EXAMPLE_DATA = {
  goals: [
    {
      id: 'twitter_followers',
      name: 'Twitter Followers',
      target: 10000,
      current: 2500,
      burnPercentage: 0.5,
      description: 'Reach 10K followers for 0.5% burn'
    },
    {
      id: 'token_holders',
      name: 'Token Holders',
      target: 5000,
      current: 1200,
      burnPercentage: 1.0,
      description: 'Reach 5K holders for 1% burn'
    },
    {
      id: 'telegram_members',
      name: 'Telegram Members',
      target: 3000,
      current: 850,
      burnPercentage: 0.3,
      description: 'Reach 3K members for 0.3% burn'
    },
    {
      id: 'community_tasks',
      name: 'Community Tasks',
      target: 100,
      current: 45,
      burnPercentage: 0.2,
      description: 'Complete 100 community tasks for 0.2% burn'
    }
  ]
}

export default {
  TEAM_WALLETS,
  TOKENOMICS_CONSTANTS,
  deduplicateWallets,
  formatTokenAmount,
  calculateSupplyPercentage,
  generateBurnThresholds,
  checkBurnEligibility,
  EXAMPLE_DATA
} 