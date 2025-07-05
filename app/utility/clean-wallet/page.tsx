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
import { getGudtekBalance, MIN_GUDTEK_BALANCE, formatTokenBalance } from '@/lib/wallet'
import Image from 'next/image'
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

interface VacantAccount {
  pubkey: PublicKey
  mint: string
  lamports: number
}

// Helius token metadata endpoint (public)
const HELIUS_META_URL = 'https://api.helius.xyz/v0/token-metadata?api-key=e568033d-06d6-49d1-ba90-b3564c91851b&mint=';

export default function WalletCleanerPage() {
  const { connection } = useConnection()
  const { publicKey, connected, sendTransaction } = useWallet()
  const { toast } = useToast()

  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [vacantAccounts, setVacantAccounts] = useState<VacantAccount[]>([])
  const [totalLamports, setTotalLamports] = useState(0)
  const [closing, setClosing] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [walletLoading, setWalletLoading] = useState(false)
  const [tokenMetaMap, setTokenMetaMap] = useState<Record<string, { symbol?: string; logo?: string }>>({})
  const [history, setHistory] = useState<Array<{ date: string; sol: number }>>([])
  const [accountsClosed, setAccountsClosed] = useState(0)
  const [solFees, setSolFees] = useState(0)

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

        // Fetch token metadata for unique mints
        const uniqueMints = Array.from(new Set(vacant.map(v => v.mint))).filter(m => !tokenMetaMap[m])
        if (uniqueMints.length) {
          const metaEntries: [string, { symbol?: string; logo?: string }][] = []
          await Promise.all(uniqueMints.map(async (mint) => {
            try {
              const res = await fetch(HELIUS_META_URL + mint)
              if (res.ok) {
                const json = await res.json()
                metaEntries.push([mint, { symbol: json?.symbol, logo: json?.image }])
              }
            } catch (err) {
              console.warn('Meta fetch failed', err)
            }
          }))
          if (metaEntries.length) {
            setTokenMetaMap(prev => ({ ...prev, ...Object.fromEntries(metaEntries) }))
          }
        }
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

  // Load token balance when wallet connects
  useEffect(() => {
    if (!connected || !publicKey) {
      setTokenBalance(0)
      return
    }

    const loadBalance = async () => {
      setWalletLoading(true)
      const bal = await getGudtekBalance(publicKey.toBase58())
      setTokenBalance(bal)
      setWalletLoading(false)
    }

    loadBalance()
  }, [connected, publicKey])

  // Load historical SOL reclaimed data
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('walletCleanerHistory')
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('Failed to parse history', e)
    }
  }, [])

  const lamportsToSol = (lamports: number) => lamports / 1e9

  // Close all vacant accounts in streaming batches
  const handleCloseAll = async () => {
    if (!connected || !publicKey) return
    if (vacantAccounts.length === 0) return

    setClosing(true)
    setAccountsClosed(0)
    setSolFees(0)

    try {
      const BATCH_SIZE = 8
      const batches: VacantAccount[][] = []
      for (let i = 0; i < vacantAccounts.length; i += BATCH_SIZE) {
        batches.push(vacantAccounts.slice(i, i + BATCH_SIZE))
      }

      const confirmPromises: Promise<any>[] = []

      for (const batch of batches) {
        const tx = new Transaction()
        batch.forEach((acc) => tx.add(createCloseAccountInstruction(acc.pubkey, publicKey, publicKey)))

        const sig = await sendTransaction(tx, connection)
        // Update UI immediately (optimistic)
        setAccountsClosed((prev) => prev + batch.length)
        // Rough fee estimate: 5000 lamports per sig => 0.000005 SOL
        setSolFees((prev) => prev + (tx.signatures.length * 5000) / 1e9)

        // Push confirm promise but do not await now (pipeline)
        confirmPromises.push(connection.confirmTransaction(sig, 'processed'))
      }

      await Promise.allSettled(confirmPromises)

      // Calculate total reclaimed SOL
      const solReclaimed = lamportsToSol(totalLamports)

      toast({
        title: 'Success',
        description: `Closed ${vacantAccounts.length} accounts and reclaimed ${solReclaimed.toFixed(4)} SOL!`,
      })

      // Persist history
      const newEntry = { date: new Date().toISOString(), sol: solReclaimed }
      const newHistory = [...history, newEntry]
      setHistory(newHistory)
      if (typeof window !== 'undefined') {
        localStorage.setItem('walletCleanerHistory', JSON.stringify(newHistory))
      }

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
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Wallet Cleaner</h1>
          <p className="text-lg text-gray-800">Close vacant token accounts & reclaim lost SOL rent fees.</p>
        </div>

        {/* Savings History Chart */}
        {history.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-md border-orange-300 shadow-lg overflow-hidden mb-8">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">SOL Reclaimed History</CardTitle>
            </CardHeader>
            <CardContent className="h-56 p-4 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history.map(h => ({ date: new Date(h.date).toLocaleDateString(), sol: h.sol }))}>
                  <XAxis dataKey="date" hide />
                  <YAxis tickFormatter={(v) => v.toFixed(2)} width={30} />
                  <RechartsTooltip formatter={(value: number) => `${value.toFixed(4)} SOL`} />
                  <Line type="monotone" dataKey="sol" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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

        {/* Access Gate */}
        {connected && (
          tokenBalance >= MIN_GUDTEK_BALANCE ? null : (
            <Card className="bg-red-100 border-red-300 text-red-800 mb-8">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-bold mb-2">Insufficient $GUDTEK Balance</p>
                {walletLoading ? (
                  <p>Checking your balance...</p>
                ) : (
                  <p>
                    You need at least <span className="font-bold">{MIN_GUDTEK_BALANCE.toLocaleString()} $GUDTEK</span>{' '}
                    to use the Wallet Cleaner.
                    <br />Your current balance: <span className="font-bold">{formatTokenBalance(tokenBalance)}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )
        )}

        {/* Vacant Accounts Card */}
        {connected && tokenBalance >= MIN_GUDTEK_BALANCE && (
          <Card className="bg-white/80 backdrop-blur-md border-orange-300 shadow-lg overflow-hidden">
            <CardHeader className="border-b border-orange-200 p-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trash2 className="h-5 w-5" /> Vacant Token Accounts
              </CardTitle>
            </CardHeader>
            {closing && (
              <div className="text-sm text-gray-700 px-6 py-2 bg-yellow-50 border-b border-yellow-200">
                Processing… {accountsClosed}/{vacantAccounts.length} accounts closed · est fees {solFees.toFixed(4)} SOL
              </div>
            )}
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
                        <div className="flex items-center gap-2">
                          {tokenMetaMap[acc.mint]?.logo && (
                            <Image src={tokenMetaMap[acc.mint]!.logo!} alt="logo" width={16} height={16} className="rounded-full" />
                          )}
                          <span className="font-mono text-xs text-gray-800">
                            {acc.pubkey.toBase58().slice(0, 4)}...{acc.pubkey.toBase58().slice(-4)}
                          </span>
                          {tokenMetaMap[acc.mint]?.symbol && (
                            <span className="text-[10px] text-gray-600 ml-1">({tokenMetaMap[acc.mint]!.symbol})</span>
                          )}
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