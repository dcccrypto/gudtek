'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface WalletConnectButtonProps {
  className?: string
  fullWidth?: boolean
  label?: string
  size?: 'default' | 'sm' | 'lg'
}

export default function WalletConnectButton({ 
  className, 
  fullWidth = false,
  label = "Connect Wallet",
  size = 'default'
}: WalletConnectButtonProps) {
  const { connected, publicKey } = useWallet()
  const [mounted, setMounted] = useState(false)
  
  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button 
        className={cn(
          "!bg-gradient-to-r !from-orange-400 !to-yellow-500 !rounded-xl !text-white !shadow-md !border !border-orange-300/50 hover:!from-orange-500 hover:!to-yellow-600",
          fullWidth && "!w-full",
          size === 'sm' && "!py-1 !px-3 !text-sm",
          size === 'lg' && "!py-2.5 !px-6 !text-lg",
          className
        )}
      >
        {label}
      </Button>
    )
  }

  return (
    <WalletMultiButton 
      className={cn(
        "!bg-gradient-to-r !from-orange-400 !to-yellow-500 !rounded-xl !py-1.5 !px-4 !text-sm !font-medium !text-white !shadow-md !border !border-orange-300/50 hover:!from-orange-500 hover:!to-yellow-600",
        fullWidth && "!w-full",
        size === 'sm' && "!py-1 !px-3 !text-sm",
        size === 'lg' && "!py-2.5 !px-6 !text-lg",
        className
      )}
    />
  )
} 