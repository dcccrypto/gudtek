'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ExternalLink, Flame, Target, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign, Lock } from 'lucide-react'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
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

interface SupplyData {
  totalSupply: number
  circulatingSupply: number
  teamHoldings: {
    address: string
    balance: number
    percentage: number
    label: string
    isLocked: boolean
  }[]
  bonkHoldings: {
    address: string
    balance: number
    percentage: number
    label: string
    isLocked: boolean
  }
  totalTeamBalance: number
  totalTeamPercentage: number
  totalLockedSupply: number
  totalLockedPercentage: number
}

export default function TokenomicsPage() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [walletData, setWalletData] = useState<WalletData[]>([])
  const [burnThresholds, setBurnThresholds] = useState<BurnThreshold[]>([])
  const [totalTeamHeld, setTotalTeamHeld] = useState(0)
  const [totalTeamBurned, setTotalTeamBurned] = useState(0)
  const [supplyData, setSupplyData] = useState<SupplyData | null>(null)
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

  // Fetch comprehensive supply data from API
  const fetchSupplyData = async () => {
    try {
      const response = await fetch('/api/total-supply')
      const data = await response.json()
      
      if (data.success) {
        setSupplyData(data.data)
      }
    } catch (error) {
      console.error('Error fetching supply data:', error)
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
      fetchWalletBalances(),
      fetchSupplyData()
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
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      <Navbar />

      <main className="relative z-10 py-12 px-4 pt-24">
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              <DollarSign className="inline-block mr-4" aria-hidden="true" />
              Tekonomics
            </h1>
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

          {/* Comprehensive Supply Breakdown Section */}
          {supplyData && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <Card className="bg-white/20 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-orange-500/5" />
                <CardHeader className="relative pb-6">
                  <CardTitle className="flex items-center space-x-3 text-2xl font-bold">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <DollarSign className="w-8 h-8 text-blue-700" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Complete Supply Breakdown
                    </span>
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-600 font-medium">Real-time Helius blockchain data</span>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-4 bg-white/15 rounded-2xl border border-white/30 backdrop-blur-sm">
                      <div className="text-3xl font-black text-gray-900 mb-2">
                        {formatTokenBalance(supplyData.totalSupply)}
                      </div>
                      <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Total Supply</div>
                      <div className="text-xs text-gray-500 mt-1">Fixed at creation</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white/15 rounded-2xl border border-white/30 backdrop-blur-sm">
                      <div className="text-3xl font-black text-green-700 mb-2">
                        {formatTokenBalance(supplyData.circulatingSupply)}
                      </div>
                      <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Circulating Supply</div>
                      <div className="text-xs text-gray-500 mt-1">{((supplyData.circulatingSupply / supplyData.totalSupply) * 100).toFixed(1)}% of total</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white/15 rounded-2xl border border-white/30 backdrop-blur-sm">
                      <div className="text-3xl font-black text-orange-700 mb-2">
                        {formatTokenBalance(supplyData.totalLockedSupply)}
                      </div>
                      <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Locked Supply</div>
                      <div className="text-xs text-gray-500 mt-1">{supplyData.totalLockedPercentage.toFixed(1)}% locked</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white/15 rounded-2xl border border-white/30 backdrop-blur-sm">
                      <div className="text-3xl font-black text-blue-700 mb-2">
                        {formatTokenBalance(supplyData.totalTeamBalance)}
                      </div>
                      <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Team Holdings</div>
                      <div className="text-xs text-gray-500 mt-1">{supplyData.totalTeamPercentage.toFixed(1)}% of supply</div>
                    </div>
                  </div>

                  {/* Supply Distribution Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Supply Breakdown Pie Chart */}
                    <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                        <span>Supply Distribution</span>
                      </h3>
                      <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Circulating', value: supplyData.circulatingSupply, color: '#22c55e' },
                                { name: 'BONK Locked', value: supplyData.bonkHoldings.balance, color: '#f97316' },
                                { name: 'Team Holdings', value: supplyData.totalTeamBalance, color: '#3b82f6' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth={2}
                            >
                              {[
                                { name: 'Circulating', value: supplyData.circulatingSupply, color: '#22c55e' },
                                { name: 'BONK Locked', value: supplyData.bonkHoldings.balance, color: '#f97316' },
                                { name: 'Team Holdings', value: supplyData.totalTeamBalance, color: '#3b82f6' }
                              ].map((entry, index) => (
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
                      </div>
                    </div>

                    {/* Detailed Wallet Breakdown */}
                    <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
                        <span>Wallet Holdings</span>
                      </h3>
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {/* BONK Wallet */}
                        <div className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Image src="/bonk1-bonk-logo.svg" alt="BONK logo" width={16} height={16} className="w-4 h-4" />
                              <span className="font-bold text-orange-900">{supplyData.bonkHoldings.label}</span>
                            </div>
                            <Badge className="bg-orange-500/20 text-orange-900 border-orange-500/30">LOCKED</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 font-mono">
                              {formatAddress(supplyData.bonkHoldings.address)}
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-orange-900">
                                {formatTokenBalance(supplyData.bonkHoldings.balance)}
                              </div>
                              <div className="text-xs text-gray-600">{supplyData.bonkHoldings.percentage.toFixed(2)}%</div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <a
                              href={`https://solscan.io/account/${supplyData.bonkHoldings.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-xs text-orange-700 hover:text-orange-800 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Verify on Solscan</span>
                            </a>
                          </div>
                        </div>

                        {/* Team Wallets */}
                        {supplyData.teamHoldings.map((wallet, index) => (
                          <div key={wallet.address} className="p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-lg overflow-hidden border border-white/30 flex-shrink-0">
                                  <Image
                                    src={MASCOT_IMAGES[index] || '/artwork/mascot1.png'}
                                    alt={`Mascot ${index + 1}`}
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="font-semibold text-gray-900 text-sm">{`Gud Tek Wallet ${index + 1}`}</span>
                </div>
                              {wallet.label.includes('Dev') && (
                                <Badge className="bg-blue-500/20 text-blue-900 border-blue-500/30 text-xs">DEV</Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-600 font-mono">
                                {formatAddress(wallet.address)}
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-bold text-sm text-gray-900">
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
                                className="inline-flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-800 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>View on Solscan</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-semibold mb-1">Supply Transparency</p>
                        <p>All data is fetched live from the Solana blockchain using Helius API. Team wallets are publicly tracked, and the BONK wallet contains locked supply that cannot be moved. Circulating supply represents tokens available for trading.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </motion.div>
          )}

          {/* 2x2 Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-2">
              {/* Gud Tek Allocation Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
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
            animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
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
                    {walletData.filter(w => !w.label.includes('BONK')).map((wallet, index) => {
                      return (
                          <div key={wallet.address} className={`p-3 rounded-xl border transition-all duration-200`}>
                            <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-lg overflow-hidden border-2 flex-shrink-0`}>
                                <Image
                                  src={MASCOT_IMAGES[index] || '/artwork/mascot1.png'}
                                  alt={`Mascot ${index + 1}`}
                                    width={32}
                                    height={32}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                  <div className={`font-semibold text-sm`}>
                                  {wallet.label}
                                </div>
                                  <div className="text-xs text-gray-600 font-mono">
                                  {formatAddress(wallet.address)}
                    </div>
                  </div>
                    </div>
                    <div className="text-right">
                                <div className={`font-mono font-bold text-sm`}>
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
                                className={`inline-flex items-center space-x-1 text-xs transition-colors`}
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

                        {/* Bottom Row - Gud Tek Allocation & Community Goals + Gud Burns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-2">
              {/* Community Goals & Gud Burns Combined */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Card className="group bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl overflow-hidden h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-red-500/5 to-orange-500/5" />
                  <CardHeader className="relative pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                      <div className="p-2 bg-gradient-to-r from-purple-500/20 to-red-500/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-red-500/30 transition-colors duration-300">
                        <div className="flex items-center space-x-1">
                          <Target className="w-5 h-5 text-purple-700" />
                          <Flame className="w-5 h-5 text-red-700" />
                        </div>
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Community Goals & Gud Burns
                </span>
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-red-500 rounded-full animate-pulse" />
                      <span className="text-sm text-gray-600 font-medium">Community milestones & burn mechanics</span>
              </div>
            </CardHeader>
                  <CardContent className="relative space-y-4">
                    {/* Current Market Cap Display */}
                    <div className="text-center p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl border border-white/30 backdrop-blur-sm">
                      <div className="text-xl font-black text-gray-900 mb-1">
                        ${tokenData ? formatNumber(tokenData.marketCap) : '---'}
                      </div>
                      <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Current Market Cap</div>
                    </div>
                    
                    {/* Gud Burns Section */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Flame className="w-4 h-4 text-red-600" />
                        <span className="font-bold text-sm text-gray-900">Gud Burns 🔥</span>
                        </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {burnThresholds.slice(0, 4).map((threshold, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {threshold.achieved ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-gray-500" />
                              )}
                              <span className="text-xs font-medium">
                                ${formatNumber(threshold.threshold)}
                          </span>
                        </div>
                            <Badge variant={threshold.achieved ? "default" : "secondary"} className="text-xs">
                              {threshold.percentage}% burn
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Community Goals Section */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-sm text-gray-900">Community Goals</span>
                      </div>
                      
                      {/* Blur Overlay for Community Goals */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-xl z-10 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl mb-2">🚀</div>
                            <h3 className="text-sm font-black text-gray-900 mb-1">Coming Soon</h3>
                            <p className="text-gray-700 text-xs max-w-xs mx-auto">
                              Community milestones in development
                            </p>
                          </div>
                        </div>
                        
                        {/* Placeholder Content (blurred) */}
                        <div className="space-y-2 opacity-50">
                          {['Twitter Followers', 'Token Holders'].map((goal, index) => (
                            <div key={index} className="p-2 bg-white/10 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-gray-900 text-xs">{goal}</span>
                                <Badge variant="outline" className="text-xs">0.5% burn</Badge>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} />
                              </div>
                    </div>
                ))}
              </div>
                  </div>
                    </div>

                    {/* Logic Explanation */}
                    <div className="text-xs text-gray-600 p-2 bg-white/10 rounded-lg">
                      <strong>Logic:</strong> 0.5% supply burned per $100K milestone (24h sustained) + community milestones
                    </div>
            </CardContent>
          </Card>
        </motion.div>
            </div>
          </div>

          
        </div>
      </main>

      <SiteFooter />
    </div>
  )
} 