import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateUserTokenBalance } from '@/lib/supabase';
import { Connection } from '@solana/web3.js';

// Fetch current GUDTEK price in USD using DexScreener
async function fetchGudtekPriceUsd(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.dexscreener.com/tokens/v1/solana/5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk',
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`);
    const json = await res.json();
    const priceStr = json?.[0]?.priceUsd as string | undefined;
    const price = priceStr ? parseFloat(priceStr) : NaN;
    if (!price || Number.isNaN(price)) throw new Error('Invalid price');
    return price;
  } catch (err) {
    console.error('Failed to fetch GUDTEK price from DexScreener:', err);
    // Fallback to 0 to block burn if price unavailable
    return 0;
  }
}

// Helper to compute token amount for a given USD value (ceil to whole tokens)
async function usdToGudtekTokens(usdAmount: number): Promise<number> {
  const price = await fetchGudtekPriceUsd();
  if (price <= 0) throw new Error('Unable to retrieve live GUDTEK price');
  return Math.ceil(usdAmount / price);
}

// RPC endpoint (use same as client helper)
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Burn address commonly used on Solana (can also verify explicit Burn instruction)
const BURN_ADDRESS = '11111111111111111111111111111111';

async function verifyOnChainBurn(
  walletAddress: string,
  txSignature: string,
  minAmount: number
) {
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  const tx = await connection.getParsedTransaction(txSignature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  });
  if (!tx) throw new Error('Transaction not found');

  // Iterate instructions and look for burn or transfer-to-burn
  let burnedTokens = 0;
  for (const inst of tx.transaction.message.instructions) {
    if ('parsed' in inst && inst.program === 'spl-token') {
      const parsed: any = (inst as any).parsed;
      if (!parsed) continue;
      const mint = parsed.info?.mint;
      const amt = parsed.info?.amount
        ? Number(parsed.info.amount)
        : parsed.info?.tokenAmount?.amount
        ? Number(parsed.info.tokenAmount.amount)
        : 0;
      // burn types
      if ((parsed.type === 'burn' || parsed.type === 'burnChecked') && mint === '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk') {
        burnedTokens += amt;
      }
      if ((parsed.type === 'transfer' || parsed.type === 'transferChecked') && mint === '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk' && parsed.info?.destination === BURN_ADDRESS) {
        burnedTokens += amt;
      }
    }
  }

  // Some wallets (esp. Phantom) wrap SPL instructions in inner instructions of versioned txs
  if (tx.meta?.innerInstructions?.length) {
    for (const inner of tx.meta.innerInstructions) {
      for (const inst of inner.instructions) {
        if ('parsed' in inst && (inst as any).program === 'spl-token') {
          const parsed: any = (inst as any).parsed;
          if (!parsed) continue;
          const mint = parsed.info?.mint;
          const amt = parsed.info?.amount
            ? Number(parsed.info.amount)
            : parsed.info?.tokenAmount?.amount
            ? Number(parsed.info.tokenAmount.amount)
            : 0;
          if ((parsed.type === 'burn' || parsed.type === 'burnChecked') && mint === '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk') {
            burnedTokens += amt;
          }
          if ((parsed.type === 'transfer' || parsed.type === 'transferChecked') && mint === '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk' && parsed.info?.destination === BURN_ADDRESS) {
            burnedTokens += amt;
          }
        }
      }
    }
  }

  const DECIMALS = 6;
  const burnedUi = burnedTokens / 10 ** DECIMALS;
  const TOLERANCE_TOKENS = 50; // accept if within 50 tokens (price drift / rounding)
  if (burnedUi + 1e-6 < minAmount - TOLERANCE_TOKENS) {
    throw new Error(`Burn amount ${burnedUi} less than required ${minAmount}`);
  }
  return burnedUi;
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, usdAmount = 1, tokenAmount, reason, txSignature } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Determine MINIMUM tokens that must be burned for the requested USD amount
    const minRequiredTokens = await usdToGudtekTokens(usdAmount);
    const expectedTokens = Math.max(minRequiredTokens, tokenAmount || 0);

    if (minRequiredTokens <= 0) {
      return NextResponse.json(
        { error: 'Failed to determine burn amount from live price' },
        { status: 503 }
      );
    }

    // Ensure we received a Solana transaction signature to verify the burn
    if (!txSignature) {
      return NextResponse.json(
        { error: 'Transaction signature (txSignature) is required for burn verification' },
        { status: 400 }
      );
    }

    // Verify burn happened on-chain BEFORE we mutate any database state.
    // This function returns the ACTUAL amount burned on-chain (UI units).
    let burnedTokensOnChain = 0;
    try {
      burnedTokensOnChain = await verifyOnChainBurn(walletAddress, txSignature, expectedTokens);
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 422 }
      );
    }

    // On-chain burn succeeded – proceed with database updates using the *actual* burned amount
    const supabase = createClient();

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('game_users')
      .select('token_balance')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const currentBalance = userData?.token_balance || 0;

    // Allow negative balances (in case of stale cache) but will sync later
    const newBalance = currentBalance - burnedTokensOnChain;
    await updateUserTokenBalance(walletAddress, newBalance);

    // Record the burn transaction
    const { data: txData, error: txError } = await supabase
      .from('token_transactions')
      .insert({
        wallet_address: walletAddress,
        amount: -burnedTokensOnChain, // Negative for burn
        transaction_type: 'burn',
        reason: reason || `Burn for $${usdAmount} USD`,
        balance_after: newBalance,
        tx_signature: txSignature
      })
      .select()
      .single();

    if (txError) {
      console.error('Error recording transaction:', txError);
      return NextResponse.json(
        { error: 'Failed to record transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      burnedTokens: burnedTokensOnChain,
      usdAmount,
      newBalance,
      transaction: txData
    });
  } catch (error) {
    console.error('Error burning tokens:', error);
    return NextResponse.json(
      { error: 'Failed to burn tokens' },
      { status: 500 }
    );
  }
} 