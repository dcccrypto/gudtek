'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import WalletConnectButton from '@/components/WalletConnectButton'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { PublicKey, Transaction } from '@solana/web3.js'
import { createCloseAccountInstruction } from '@solana/spl-token'
import { Loader2, Wallet, Trash2, CheckCircle, Coins } from 'lucide-react'

interface VacantAccount {
  pubkey: PublicKey
  mint: string
  lamports: number
}

export default function UtilityPage() {
  const { connection } = useConnection()
  const { publicKey, connected, sendTransaction } = useWallet()
  const { toast } = useToast()

  const [isNavOpen, setIsNavOpen] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [vacantAccounts, setVacantAccounts] = useState<VacantAccount[]>([])
  const [totalLamports, setTotalLamports] = useState(0)
  const [closing, setClosing] = useState(false)

  // Fetch vacant token accounts whenever wallet changes
  useEffect(() => {
    if (!connected || !publicKey) {
      setVacantAccounts([])
      setTotalLamports(0)
      return
    }

    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true)
        // Token program ID (SPL Token v1)
        const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        const accounts: any = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })

        const vacant: VacantAccount[] = accounts.value
          .filter((a: any) => a.account.data?.parsed?.info?.tokenAmount?.uiAmount === 0)
          .map((a: any) => ({
            pubkey: a.pubkey as PublicKey,
            mint: a.account.data.parsed.info.mint,
            lamports: a.account.lamports as number,
          }))

        setVacantAccounts(vacant)
        const total = vacant.reduce((sum, acc) => sum + acc.lamports, 0)
        setTotalLamports(total)
      } catch (error: any) {
        console.error('Failed to fetch accounts', error)
        toast({
          title: 'Error',
          description: error?.message || 'Unable to fetch token accounts',
          variant: 'destructive',
        })
      } finally {
        setLoadingAccounts(false)
      }
    }

    fetchAccounts()
  }, [connected, publicKey])

  const lamportsToSol = (lamports: number) => lamports / 1e9

  // Close all vacant accounts in batches of 8 instructions per tx (to keep TX size reasonable)
  const handleCloseAll = async () => {
    if (!connected || !publicKey) return
    if (vacantAccounts.length === 0) return

    setClosing(true)

    try {
      const BATCH_SIZE = 8
      let processed = 0

      while (processed < vacantAccounts.length) {
        const batch = vacantAccounts.slice(processed, processed + BATCH_SIZE)
        const tx = new Transaction()
        batch.forEach((acc) =>
          tx.add(createCloseAccountInstruction(acc.pubkey, publicKey, publicKey))
        )

        const sig = await sendTransaction(tx, connection)
        await connection.confirmTransaction(sig, 'confirmed')
        processed += batch.length
      }

      toast({
        title: 'Success',
        description: `Closed ${vacantAccounts.length} accounts. SOL rent reclaimed will reflect shortly.`,
      })
      // Refresh list
      setVacantAccounts([])
      setTotalLamports(0)
    } catch (error: any) {
      console.error('Close accounts error', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to close accounts',
        variant: 'destructive',
      })
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Global Navbar */}
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Utility Hub</h1>
          <p className="text-lg text-gray-800">Clean up your wallet and reclaim lost SOL rent fees.</p>
        </div>

        {/* Wallet Connect Card */}
        <Card className="bg-white/80 backdrop-blur-md border-orange-300 shadow-lg overflow-hidden mb-8">
          <CardContent className="p-6">
            {!connected ? (
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <Wallet className="h-8 w-8 text-orange-500" />
                <p className="text-gray-800 text-center">Connect your Solana wallet to view and clean vacant token accounts.</p>
                <WalletConnectButton />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-6 w-6 text-orange-500" />
                  <span className="font-bold text-gray-900">
                    {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    /* trigger refetch */
                    setLoadingAccounts(true)
                    setTimeout(() => setLoadingAccounts(false), 100) // just show spinner briefly
                  }}
                >
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vacant Accounts Card */}
        {connected && (
          <Card className="bg-white/80 backdrop-blur-md border-orange-300 shadow-lg overflow-hidden">
            <CardHeader className="border-b border-orange-200 p-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trash2 className="h-5 w-5" /> Vacant Token Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : vacantAccounts.length === 0 ? (
                <p className="text-gray-700">No vacant token accounts found. Your wallet is clean!</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-orange-100 px-4 py-2 rounded-md">
                    <span className="font-medium text-gray-900">Total SOL to Reclaim</span>
                    <span className="flex items-center gap-1 font-bold text-gray-900">
                      <Coins className="h-5 w-5" />
                      {lamportsToSol(totalLamports).toFixed(4)} SOL
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto pr-2">
                    {vacantAccounts.map((acc) => (
                      <div
                        key={acc.pubkey.toBase58()}
                        className="flex items-center justify-between bg-white/60 backdrop-blur-sm border border-orange-200 rounded-md px-3 py-2 mb-2"
                      >
                        <div className="font-mono text-xs text-gray-800">
                          {acc.pubkey.toBase58().slice(0, 6)}...{acc.pubkey.toBase58().slice(-6)}
                        </div>
                        <div className="text-xs text-gray-700">
                          {lamportsToSol(acc.lamports).toFixed(4)} SOL
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold"
                    disabled={closing}
                    onClick={handleCloseAll}
                  >
                    {closing ? (
                      <span className="flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Closing Accounts...</span>
                    ) : (
                      <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-2" /> Close All &amp; Reclaim SOL</span>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}