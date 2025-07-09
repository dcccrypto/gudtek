'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ExternalLink, Flame, Target, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign, Lock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTokenBalance } from '@/lib/wallet'
import Image from 'next/image'

// Constants
const TOTAL_SUPPLY = 1000000000 // 1 billion

// Mascot images for wallets
const MASCOT_IMAGES = [
  '/artwork/mascot4.png',
  '/artwork/mascot3.png',
  '/artwork/mascot2.png',
  '/artwork/mascot1.png',
  '/artwork/chess.png',
  '/Gudmusic/tekisgud.jpg',
  '/bonk1-bonk-logo.svg' // BONK logo for the locked wallet
]

interface TokenData {
  priceUsd: string
  marketCap: number
}

interface WalletData {
  address: string
  balance: number
  percentage: number
  label: string
}

interface BurnThreshold {
  threshold: number
  percentage: number
  achieved: boolean
  timeAboveThreshold: number
}

export default function CompactTokenomics() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [walletData, setWalletData] = useState<WalletData[]>([])
  const [burnThresholds, setBurnThresholds] = useState<BurnThreshold[]>([])
  const [totalTeamHeld, setTotalTeamHeld] = useState(0)
  const [totalTeamBurned, setTotalTeamBurned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch token price and market cap data
  const fetchTokenData = async () => {
    try {
      const response = await fetch('https://api.dexscreener.com/tokens/v1/solana/5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk')
      const data = await response.json()
      
      if (data && data.length > 0) {
        setTokenData({
          priceUsd: data[0].priceUsd,
          marketCap: data[0].marketCap
        })
      }
    } catch (error) {
      console.error('Error fetching token data:', error)
    }
  }

  // Fetch team wallet balances from API
  const fetchWalletBalances = async () => {
    try {
      const response = await fetch('/api/tokenomics/team-stats')
      const data = await response.json()
      
      if (data.success) {
        setWalletData(data.wallets)
        setTotalTeamHeld(data.totals.totalTeamHeld)
        setTotalTeamBurned(data.totals.totalTeamBurned)
      }
    } catch (error) {
      console.error('Error fetching wallet balances:', error)
    }
  }

  // Calculate burn thresholds based on market cap
  const calculateBurnThresholds = () => {
    if (!tokenData) return

    const thresholds: BurnThreshold[] = []
    const marketCap = tokenData.marketCap

    // Generate thresholds from $100K to $1M in $100K increments
    for (let i = 100000; i <= 1000000; i += 100000) {
      thresholds.push({
        threshold: i,
        percentage: 0.5, // 0.5% burn for each $100K milestone
        achieved: marketCap >= i,
        timeAboveThreshold: marketCap >= i ? 24 : 0
      })
    }

    setBurnThresholds(thresholds)
  }

  // Refresh all data
  const refreshData = async () => {
    setLoading(true)
    await Promise.all([
      fetchTokenData(),
      fetchWalletBalances()
    ])
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    refreshData()
    
    // Refresh every 60 seconds
    const interval = setInterval(refreshData, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    calculateBurnThresholds()
  }, [tokenData])

  // Pie chart data
  const pieData = [
    {
      name: 'Gud Tek Held',
      value: totalTeamHeld,
      percentage: totalTeamHeld > 0 ? (totalTeamHeld / (totalTeamHeld + totalTeamBurned)) * 100 : 0,
      color: '#f97316'
    },
    {
      name: 'Gud Tek Burned',
      value: totalTeamBurned,
      percentage: totalTeamBurned > 0 ? (totalTeamBurned / (totalTeamHeld + totalTeamBurned)) * 100 : 0,
      color: '#dc2626'
    }
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(0)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-orange-300/50 to-yellow-300/50 backdrop-filter backdrop-blur-sm relative" id="tokenomics">
      {/* Decorative mascot image 4 */}
      <img
        src="/artwork/mascot4.png"
        alt="Gud Tek Mascot Decorative 4"
        className="hidden sm:block absolute bottom-6 right-6 sm:w-64 md:w-80 opacity-80 rotate-[5deg] z-10 pointer-events-none select-none filter drop-shadow-lg"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
            <DollarSign className="inline-block mr-4" aria-hidden="true" />
            Tekonomics
          </h2>
          <p className="text-xl text-gray-800 max-w-3xl mx-auto">
            Real-time transparency with live wallet balances, burn mechanics, and community milestones
          </p>
          
          {/* Live Status */}
          <div className="inline-flex items-center space-x-4 mt-6 px-4 py-2 bg-white/25 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live Data</span>
            </div>
            <div className="w-px h-4 bg-gray-600/30" />
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Clock className="w-4 h-4" />
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </motion.div>



        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-2">
            {/* Gud Tek Allocation Pie Chart */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="group bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/20 hover:border-white/40 rounded-3xl overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-yellow-500/5" />
                <CardHeader className="relative pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                    <div className="p-2 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors duration-300">
                      <Flame className="w-6 h-6 text-orange-700" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Gud Tek Allocation
                    </span>
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-600 font-medium">Live blockchain data</span>
                  </div>
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-sm text-gray-700 font-medium">
                      💡 When Gud Tek supply runs out, we'll keep accumulating more with BONK and Ray creator fees
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="h-48 mb-3 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth={2}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [formatTokenBalance(value), 'Tokens']}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            backdropFilter: 'blur(10px)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Center Label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-lg font-black text-gray-900">
                          {formatTokenBalance(totalTeamHeld + totalTeamBurned)}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Total Gud Tek</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-4">
                    {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: entry.color }} />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">{entry.name}</div>
                          <div className="text-xs text-gray-600">{formatTokenBalance(entry.value)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Gud Tek Wallets */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="group bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/20 hover:border-white/40 rounded-3xl overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
                <CardHeader className="relative pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                    <div className="p-2 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                      <Target className="w-6 h-6 text-blue-700" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Gud Tek Wallets
                    </span>
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-600 font-medium">Live on-chain balances</span>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {walletData.map((wallet, index) => {
                      const isBonkWallet = wallet.label.includes('BONK')
                      return (
                        <div key={wallet.address} className={`p-3 rounded-xl border transition-all duration-200 ${
                          isBonkWallet 
                            ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/15' 
                            : 'bg-white/10 border-white/20 hover:bg-white/15'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                                isBonkWallet ? 'border-orange-500/50' : 'border-white/30'
                              }`}>
                                <Image
                                  src={MASCOT_IMAGES[index] || '/artwork/mascot1.png'}
                                  alt={`Mascot ${index + 1}`}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className={`font-semibold text-sm ${
                                  isBonkWallet ? 'text-orange-900' : 'text-gray-900'
                                }`}>
                                  {wallet.label}
                                </div>
                                <div className="text-xs text-gray-600 font-mono">
                                  {formatAddress(wallet.address)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-mono font-bold text-sm ${
                                isBonkWallet ? 'text-orange-900' : 'text-gray-900'
                              }`}>
                                {formatTokenBalance(wallet.balance)}
                              </div>
                              <div className="text-xs text-gray-600">{wallet.percentage.toFixed(2)}%</div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <a
                              href={`https://solscan.io/account/${wallet.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center space-x-1 text-xs transition-colors ${
                                isBonkWallet 
                                  ? 'text-orange-700 hover:text-orange-800' 
                                  : 'text-blue-700 hover:text-blue-800'
                              }`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View on Solscan</span>
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Total */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full" />
                        <span className="font-bold text-gray-900">Total Holdings</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-lg text-gray-900">{formatTokenBalance(totalTeamHeld)}</div>
                        <div className="text-sm text-gray-600">{((totalTeamHeld / TOTAL_SUPPLY) * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-2">
            {/* Market Cap Burn Thresholds */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="group bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/20 hover:border-white/40 rounded-3xl overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />
                <CardHeader className="relative pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                    <div className="p-2 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
                      <TrendingUp className="w-6 h-6 text-green-700" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Burn Thresholds
                    </span>
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-600 font-medium">Real-time market data</span>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {/* Current Market Cap Display */}
                  <div className="text-center p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-white/30 backdrop-blur-sm mb-3">
                    <div className="text-2xl font-black text-gray-900 mb-1">
                      ${tokenData ? formatNumber(tokenData.marketCap) : '---'}
                    </div>
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Current Market Cap</div>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {burnThresholds.slice(0, 6).map((threshold, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {threshold.achieved ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm font-medium">
                            ${formatNumber(threshold.threshold)}
                          </span>
                        </div>
                        <Badge variant={threshold.achieved ? "default" : "secondary"} className="text-xs">
                          {threshold.percentage}% burn
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-600 mt-4 p-2 bg-white/10 rounded-lg">
                    <strong>Logic:</strong> 0.5% of total supply burned per $100K milestone (24h sustained)
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Coming Soon Community Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="group bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
                <CardHeader className="relative pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                    <div className="p-2 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                      <Target className="w-6 h-6 text-purple-700" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Community Goals
                    </span>
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-600 font-medium">Community-driven milestones</span>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {/* Blur Overlay */}
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-2xl z-10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-3">🚀</div>
                      <h3 className="text-xl font-black text-gray-900 mb-2">Coming Soon</h3>
                      <p className="text-gray-700 text-sm max-w-xs mx-auto">
                        Community goals and burn milestones are being finalized. Stay tuned!
                      </p>
                    </div>
                  </div>
                  
                  {/* Placeholder Content (blurred) */}
                  <div className="space-y-3 opacity-50">
                    {['Twitter Followers', 'Token Holders', 'Telegram Members', 'Community Tasks'].map((goal, index) => (
                      <div key={index} className="p-3 bg-white/10 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 text-sm">{goal}</span>
                          <Badge variant="outline" className="text-xs">0.5% burn</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
} 