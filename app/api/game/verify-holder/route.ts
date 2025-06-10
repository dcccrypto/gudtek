import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateGameUser, updateUserTokenBalance, getGameSetting } from '@/lib/supabase'

// Mock token verification - replace with actual Solana token verification
async function verifyTokenBalance(walletAddress: string): Promise<number> {
  try {
    // In a real implementation, you would:
    // 1. Connect to Solana RPC
    // 2. Get token account for the wallet
    // 3. Return the token balance
    
    // For now, returning a mock balance for demonstration
    // You can integrate with @solana/web3.js here
    
    // Mock: wallets starting with certain letters have different balances
    if (walletAddress.toLowerCase().startsWith('gud')) {
      return 5000 // High balance for demo
    } else if (walletAddress.toLowerCase().startsWith('test')) {
      return 500  // Low balance for demo
    } else {
      return 2000 // Default balance for demo
    }
    
    // Real implementation would look like:
    /*
    const connection = new Connection(process.env.SOLANA_RPC_URL!)
    const tokenMintAddress = await getGameSetting('token_contract_address')
    const walletPublicKey = new PublicKey(walletAddress)
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { mint: new PublicKey(tokenMintAddress) }
    )
    
    if (tokenAccounts.value.length === 0) return 0
    
    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
    return balance || 0
    */
  } catch (error) {
    console.error('Error verifying token balance:', error)
    return 0
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Get current token balance from blockchain
    const tokenBalance = await verifyTokenBalance(walletAddress)
    
    // Get minimum required balance
    const minBalance = parseFloat(await getGameSetting('min_token_balance') || '10000')
    
    // Get or create user in our database
    const user = await getOrCreateGameUser(walletAddress, tokenBalance)
    
    // Update balance in database
    await updateUserTokenBalance(walletAddress, tokenBalance)
    
    const canPlay = tokenBalance >= minBalance && !user.is_banned
    
    return NextResponse.json({
      success: true,
      canPlay,
      tokenBalance,
      minBalance,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        isVerified: user.is_verified,
        isBanned: user.is_banned
      }
    })
  } catch (error) {
    console.error('Error verifying holder:', error)
    return NextResponse.json(
      { error: 'Failed to verify token holder' },
      { status: 500 }
    )
  }
} 