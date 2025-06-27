'use client'

import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trophy, Medal, Award, Wallet, RefreshCw, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react'
import WalletConnectButton from '@/components/WalletConnectButton'
import { getGudtekBalance } from '@/lib/wallet'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'

interface TokenHolder {
  address: string
  balance: number
  rank: number
  first_prize: number
  second_prize: number
  third_prize: number
}

interface LeaderboardData {
  success: boolean
  total_holders: number
  top_100: TokenHolder[]
  last_updated: string
  prizes: {
    total_pools: {
      first: number
      second: number
      third: number
    }
    distribution_pools: {
      first: number
      second: number
      third: number
    }
  }
}

interface UserStatus {
  connected: boolean
  balance: number
  rank: number | null
  isTop100: boolean
  tokensNeeded: number
}

const formatAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toFixed(0)
}

const formatPrize = (amount: number) => {
  if (amount === 0) return '-'
  return `$${formatNumber(amount)}`
}

export default function HackathonLeaderboard() {
  const { connected, publicKey } = useWallet()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userStatus, setUserStatus] = useState<UserStatus>({
    connected: false,
    balance: 0,
    rank: null,
    isTop100: false,
    tokensNeeded: 0
  })
  const [checkingWallet, setCheckingWallet] = useState(false)

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/hackathon/leaderboard')
      const data = await response.json()
      
      if (data.success) {
        setLeaderboardData(data)
      } else {
        throw new Error(data.error || 'Failed to fetch leaderboard')
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      toast.error('Failed to load leaderboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const checkUserEligibility = async () => {
    if (!connected || !publicKey || !leaderboardData) return

    setCheckingWallet(true)
    try {
      const balance = await getGudtekBalance(publicKey.toString())
      
      // Find user's rank in the leaderboard
      const userEntry = leaderboardData.top_100.find(holder => holder.address === publicKey.toString())
      const isTop100 = !!userEntry
      const rank = userEntry?.rank || null
      
      // Calculate tokens needed to get into top 100
      let tokensNeeded = 0
      if (!isTop100 && leaderboardData.top_100.length >= 100) {
        const minBalanceForTop100 = leaderboardData.top_100[99].balance
        tokensNeeded = Math.max(0, minBalanceForTop100 - balance + 1)
      }

      setUserStatus({
        connected: true,
        balance,
        rank,
        isTop100,
        tokensNeeded
      })

      if (isTop100) {
        toast.success(`🎉 You're ranked #${rank} in the top 100!`)
      } else {
        toast.info(`You need ${formatNumber(tokensNeeded)} more GUDTEK tokens to reach top 100`)
      }
    } catch (error) {
      console.error('Error checking user eligibility:', error)
      toast.error('Failed to check wallet eligibility')
    } finally {
      setCheckingWallet(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLeaderboard()
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  useEffect(() => {
    if (connected && publicKey && leaderboardData) {
      checkUserEligibility()
    } else {
      setUserStatus({
        connected: false,
        balance: 0,
        rank: null,
        isTop100: false,
        tokensNeeded: 0
      })
    }
  }, [connected, publicKey, leaderboardData])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return <span className="text-sm font-medium">{rank}</span>
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white">🏆 1st</Badge>
    if (rank === 2) return <Badge className="bg-gray-400 text-white">🥈 2nd</Badge>
    if (rank === 3) return <Badge className="bg-amber-600 text-white">🥉 3rd</Badge>
    if (rank <= 10) return <Badge variant="secondary">Top 10</Badge>
    return <Badge variant="outline">#{rank}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Global Navbar Component */}
      <Navbar />

      {/* Main Content */}
      <div className="pt-16 relative z-10">
        {/* Hero Header */}
        <div className="relative min-h-[40vh] flex flex-col items-center justify-center px-4 text-center">
          {/* Decorative mascot image 1 */}
          <img
            src="/artwork/mascot1.png"
            alt="Gud Tek Mascot Decorative"
            className="hidden sm:block absolute top-20 left-4 sm:w-64 md:w-80 opacity-80 rotate-[-10deg] z-10 pointer-events-none select-none filter drop-shadow-lg"
            aria-hidden="true"
          />
          {/* Decorative mascot image 2 */}
          <img
            src="/artwork/mascot2.png"
            alt="Gud Tek Mascot Decorative 2"
            className="hidden sm:block absolute top-24 right-4 sm:w-64 md:w-80 opacity-80 rotate-[8deg] z-10 pointer-events-none select-none filter drop-shadow-lg"
            aria-hidden="true"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-20 max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="mb-4 mt-4"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 border-2 border-yellow-400 rounded-xl p-3 shadow-xl max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-800" />
                  </div>
                  <span className="text-sm font-black text-yellow-300">HACKATHON PRIZE DISTRIBUTION</span>
                </div>
                <p className="text-xs font-medium text-blue-100 text-center">
                  Top 100 GUDTEK holders • 25% prize sharing • Equal distribution: $500 each
                </p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-5xl md:text-7xl font-black text-gray-900 mb-4 tracking-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              🏆 HACKATHON LEADERBOARD
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-xl md:text-2xl font-bold text-gray-800 mb-8 max-w-3xl mx-auto"
            >
              Top 100 GUDTEK holders equally share 25% of total hackathon prize pools
            </motion.p>
          
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-center shadow-xl border-2 border-purple-300">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-black text-white mb-2">$140K</h3>
                <p className="text-purple-100 font-bold">1st Place Total Prize</p>
                <p className="text-sm text-purple-200 mt-1 font-medium">25% shared equally</p>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-center shadow-xl border-2 border-blue-300">
                <Medal className="w-12 h-12 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-black text-white mb-2">$50K</h3>
                <p className="text-blue-100 font-bold">2nd Place Total Prize</p>
                <p className="text-sm text-blue-200 mt-1 font-medium">25% shared equally</p>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-center shadow-xl border-2 border-green-300">
                <Award className="w-12 h-12 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-black text-white mb-2">$10K</h3>
                <p className="text-green-100 font-bold">3rd Place Total Prize</p>
                <p className="text-sm text-green-200 mt-1 font-medium">25% shared equally</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Wallet Connection & User Status */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mb-12"
          >
            <div className="bg-white/20 backdrop-filter backdrop-blur-lg border-2 border-gray-900/20 rounded-xl p-6 shadow-lg">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 mb-2 flex items-center justify-center gap-2">
                  <Wallet className="w-6 h-6" />
                  Check Your Eligibility
                </h2>
                <p className="text-gray-800">Connect your wallet to see if you qualify for the $500 prize distribution</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6">
                <WalletConnectButton className="w-full sm:w-auto !bg-orange-500 hover:!bg-orange-600 !border-2 !border-gray-900 !rounded-lg !font-bold !shadow-lg transform hover:scale-105 transition-all duration-200" />
                
                {connected && (
                  <Button 
                    onClick={checkUserEligibility} 
                    disabled={checkingWallet}
                    className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg border-2 border-gray-900"
                  >
                    {checkingWallet ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Refresh Status
                      </>
                    )}
                  </Button>
                )}
              </div>

              {userStatus.connected && (
                <div className="bg-gradient-to-r from-orange-300/50 to-yellow-300/50 backdrop-filter backdrop-blur-sm rounded-xl p-6 border-2 border-orange-400/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center md:text-left">
                      <div className="text-sm text-gray-700 mb-1">Your GUDTEK Balance</div>
                      <div className="text-3xl font-black text-gray-900">
                        {formatNumber(userStatus.balance)} GUDTEK
                      </div>
                    </div>
                    
                    <div className="text-center md:text-left">
                      <div className="text-sm text-gray-700 mb-1">Your Status</div>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        {userStatus.isTop100 ? (
                          <>
                            {getRankBadge(userStatus.rank!)}
                            <span className="text-green-700 font-bold">🎉 Eligible for prizes!</span>
                          </>
                        ) : (
                          <Badge variant="outline" className="border-gray-600 text-gray-800 font-bold">
                            Not in Top 100
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {!userStatus.isTop100 && userStatus.tokensNeeded > 0 && (
                    <div className="mt-6 bg-blue-100/80 border-2 border-blue-300 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-blue-800 font-bold">
                            You need <span className="text-blue-900 font-black">{formatNumber(userStatus.tokensNeeded)} more GUDTEK tokens</span> to enter the top 100 and become eligible for hackathon prizes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="bg-white/20 backdrop-filter backdrop-blur-lg border-2 border-gray-900/20 rounded-xl shadow-lg overflow-hidden mt-8 mb-8"
          >
            <div className="p-6 border-b border-gray-900/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="w-8 h-8" />
                    Top 100 GUDTEK Holders
                  </h2>
                  <p className="text-gray-800">
                    {leaderboardData && (
                      <>
                        Total Holders: <span className="font-bold">{leaderboardData.total_holders.toLocaleString()}</span> • 
                        Last Updated: <span className="font-bold">{new Date(leaderboardData.last_updated).toLocaleTimeString()}</span>
                      </>
                    )}
                  </p>
                </div>
                
                <Button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold shadow-lg border-2 border-gray-900"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          
            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-white/30 rounded-lg p-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : leaderboardData ? (
                <ScrollArea className="h-[600px] w-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur border-b-2 border-slate-700/50">
                      <TableRow>
                        <TableHead className="w-16 text-white font-black text-sm">Rank</TableHead>
                        <TableHead className="text-white font-black text-sm">Wallet Address</TableHead>
                        <TableHead className="text-right text-white font-black text-sm">GUDTEK Balance</TableHead>
                        <TableHead className="text-center hidden md:table-cell text-purple-200 font-black text-sm">1st Prize<br/>$350</TableHead>
                        <TableHead className="text-center hidden md:table-cell text-blue-200 font-black text-sm">2nd Prize<br/>$125</TableHead>
                        <TableHead className="text-center hidden md:table-cell text-green-200 font-black text-sm">3rd Prize<br/>$25</TableHead>
                        <TableHead className="text-center md:hidden text-white font-black text-sm">Total Prize</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {leaderboardData.top_100.map((holder) => (
                      <TableRow 
                        key={holder.address}
                        className={`
                          ${holder.rank <= 3 ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20' : ''}
                          ${holder.rank <= 10 ? 'bg-orange-300/10' : ''}
                          ${userStatus.connected && holder.address === publicKey?.toString() ? 'ring-2 ring-orange-500 bg-orange-300/30' : ''}
                          hover:bg-white/30 transition-colors border-b border-gray-900/10
                        `}
                      >
                        <TableCell className="font-bold text-sm">
                          <div className="flex items-center gap-2">
                            {getRankIcon(holder.rank)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                            <code className="bg-gray-900/10 border border-gray-900/20 px-3 py-1 rounded-lg text-sm font-mono font-bold text-gray-900">
                              {formatAddress(holder.address)}
                            </code>
                            {userStatus.connected && holder.address === publicKey?.toString() && (
                              <Badge className="bg-green-500 text-white text-xs font-bold">You</Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right font-bold text-sm text-gray-900">
                          {formatNumber(holder.balance)}
                        </TableCell>
                        
                        {/* Desktop view - separate prize columns */}
                        <TableCell className="text-center hidden md:table-cell">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg px-3 py-2 border border-purple-400">
                            <span className="text-white font-bold text-sm">${holder.first_prize}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center hidden md:table-cell">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg px-3 py-2 border border-blue-400">
                            <span className="text-white font-bold text-sm">${holder.second_prize}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center hidden md:table-cell">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg px-3 py-2 border border-green-400">
                            <span className="text-white font-bold text-sm">${holder.third_prize}</span>
                          </div>
                        </TableCell>
                        
                        {/* Mobile view - total prize */}
                        <TableCell className="text-center md:hidden">
                          <div className="bg-gradient-to-r from-orange-500 to-yellow-600 rounded-lg px-3 py-2 border border-orange-400">
                            <span className="text-white font-bold text-sm">${holder.first_prize + holder.second_prize + holder.third_prize}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-red-100/80 border-2 border-red-300 rounded-lg p-6 max-w-md mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-bold">Failed to load leaderboard data</p>
                    <p className="text-red-700 text-sm mt-1">Please try refreshing the page</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-filter backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-slate-600/50 text-center mt-12"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
            >
              <h3 className="text-3xl font-black text-white mb-6 flex items-center justify-center gap-2">
                <Trophy className="w-8 h-8 text-yellow-400" />
                Hackathon Prize Distribution
              </h3>
              <div className="max-w-4xl mx-auto space-y-6">
                <p className="text-xl font-bold text-gray-200 leading-relaxed">
                  25% of each hackathon prize pool is equally distributed among all top 100 GUDTEK token holders
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 border border-purple-400/50">
                    <Trophy className="w-8 h-8 mx-auto mb-3 text-white" />
                    <p className="text-2xl font-black text-white mb-2">$140K</p>
                    <p className="text-purple-100 font-bold">1st Place Pool</p>
                    <p className="text-sm text-purple-200 mt-1">25% → Top 100</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 border border-blue-400/50">
                    <Medal className="w-8 h-8 mx-auto mb-3 text-white" />
                    <p className="text-2xl font-black text-white mb-2">$50K</p>
                    <p className="text-blue-100 font-bold">2nd Place Pool</p>
                    <p className="text-sm text-blue-200 mt-1">25% → Top 100</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 border border-green-400/50">
                    <Award className="w-8 h-8 mx-auto mb-3 text-white" />
                    <p className="text-2xl font-black text-white mb-2">$10K</p>
                    <p className="text-green-100 font-bold">3rd Place Pool</p>
                    <p className="text-sm text-green-200 mt-1">25% → Top 100</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-6 border border-orange-400/30 mt-8">
                  <p className="text-lg text-gray-100 font-medium">
                    🎯 Equal Distribution: Every top 100 holder receives their share from all qualifying hackathon placements
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 