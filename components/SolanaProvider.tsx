'use client'

import React, { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets'

// Import wallet adapter CSS (required for styling)
require('@solana/wallet-adapter-react-ui/styles.css')

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
  // Use Helius RPC for better performance and reliability
  const endpoint = useMemo(() => 
    'https://mainnet.helius-rpc.com/?api-key=e568033d-06d6-49d1-ba90-b3564c91851b',
    []
  )

  // Initialize wallets with better error handling
  const wallets = useMemo(() => {
    const availableWallets: any[] = []
    
    try {
      // Only add wallets that are available in the current environment
      if (typeof window !== 'undefined') {
        // Initialize wallets individually to catch specific errors
        const walletClasses = [
          { name: 'Phantom', class: PhantomWalletAdapter },
          { name: 'Solflare', class: SolflareWalletAdapter },
          { name: 'Torus', class: TorusWalletAdapter }
        ]
        
        walletClasses.forEach(({ name, class: WalletClass }) => {
          try {
            availableWallets.push(new WalletClass())
          } catch (error) {
            console.warn(`${name} wallet adapter failed to initialize:`, error)
          }
        })
      }
    } catch (error) {
      console.warn('Wallet initialization error:', error)
    }

    return availableWallets
  }, [])

  // Handle wallet errors gracefully
  const onError = useMemo(
    () => (error: any) => {
      console.error('Wallet error:', error)
      
      // Handle specific error types
      if (error.message?.includes('MetaMask')) {
        console.warn('MetaMask not found - this is normal if using other wallets')
        return // Don't show error for MetaMask not found
      }
      
      if (error.message?.includes('extension not found')) {
        console.warn('Wallet extension not found:', error.message)
        return // Don't show error for missing extensions
      }
      
      // Only log serious errors
      if (error.message && !error.message.includes('User rejected')) {
        console.error('Serious wallet error:', error)
      }
    },
    []
  )

  return (
    <ConnectionProvider 
      endpoint={endpoint}
      config={{
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      }}
    >
      <WalletProvider 
        wallets={wallets} 
        onError={onError}
        autoConnect={false} // Prevent auto-connect to avoid hydration issues
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
} 