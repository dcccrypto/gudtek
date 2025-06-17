'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { Loader2 } from 'lucide-react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import WalletConnectButton from './WalletConnectButton'
import { PublicKey, Transaction } from '@solana/web3.js'
import { getAssociatedTokenAddress, createBurnCheckedInstruction } from '@solana/spl-token'

interface PFPPreviewProps {
  imageUrl: string
  id: string
  onBurnComplete?: () => void
}

const GUDTEK_MINT = new PublicKey('5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk')
const USD_BURN_AMOUNT = 1
const DECIMALS = 6 // $GUDTEK mint decimals

export default function PFPPreview({ imageUrl, id, onBurnComplete }: PFPPreviewProps) {
  const { publicKey, connected, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()
  const [isBurning, setIsBurning] = useState(false)
  
  const handleBurn = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first.",
        variant: "destructive"
      })
      return
    }
    
    setIsBurning(true)
    
    try {
      // 1. Fetch live price to know how many tokens to burn (ceil)
      const priceRes = await fetch('https://api.dexscreener.com/tokens/v1/solana/5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk')
      const priceJson = await priceRes.json()
      const price = parseFloat(priceJson?.[0]?.priceUsd || '0')
      if (!price) throw new Error('Unable to get live $GUDTEK price')
      const tokensToBurn = Math.ceil(USD_BURN_AMOUNT / price)

      // 2. Build burn instruction (destroys tokens in-place)
      const ata = await getAssociatedTokenAddress(GUDTEK_MINT, publicKey as PublicKey)
      const ix = createBurnCheckedInstruction(ata, GUDTEK_MINT, publicKey as PublicKey, tokensToBurn * 10 ** DECIMALS, DECIMALS)
      const tx = new Transaction().add(ix)
      const sig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(sig, 'confirmed')

      // 3. Call backend to verify and download
      const res = await fetch(`/api/pfp/download/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toString(), txSignature: sig, tokenAmount: tokensToBurn }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to download')
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'GUDTEK_PFP.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Success!',
        description: `Your PFP has been downloaded and ${tokensToBurn.toLocaleString()} $GUDTEK burned on-chain.`,
        action: (
          <ToastAction altText="View Transaction" onClick={() => window.open(`https://solscan.io/tx/${sig}`, '_blank')}>View Tx</ToastAction>
        )
      })
      
      if (onBurnComplete) onBurnComplete()
    } catch (error) {
      console.error('Error downloading PFP:', error)
      const errMsg = error instanceof Error ? error.message : 'Failed to download PFP. Please try again.'
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive"
      })
    } finally {
      setIsBurning(false)
    }
  }
  
  return (
    <Card className="overflow-hidden bg-white/10 backdrop-blur-sm border-white/20">
      <div className="relative aspect-square">
        <Image 
          src={imageUrl} 
          alt="Generated PFP" 
          fill 
          className="object-cover"
        />
        <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
          Preview
        </Badge>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-800 font-medium">
          Burn $1 of $GUDTEK to download without watermark
        </p>
        {connected ? (
          <Button 
            onClick={handleBurn} 
            disabled={isBurning}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isBurning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Burn $1 of $GUDTEK'
            )}
          </Button>
        ) : (
          <WalletConnectButton fullWidth />
        )}
      </div>
    </Card>
  )
} 