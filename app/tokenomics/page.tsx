'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { ExternalLink, Flame, Target, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatTokenBalance } from '@/lib/wallet'

// Constants
const TOTAL_SUPPLY = 1000000000 // 1 billion

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

interface GoalData {
  id: string
  name: string
  target: number
  current: number
  progress: number
  unit: string
  description: string
}

interface BurnThreshold {
  threshold: number
  percentage: number
  achieved: boolean
  timeAboveThreshold: number
}

export default function TokenomicsPage() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [walletData, setWalletData] = useState<WalletData[]>([])
  const [goalData, setGoalData] = useState<GoalData[]>([])
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

  // Fetch goals data from API
  const fetchGoalsData = async () => {
    try {
      const response = await fetch('/api/tokenomics/goals')
      const data = await response.json()
      
      if (data.success) {
        setGoalData(data.goals)
      }
    } catch (error) {
      console.error('Error fetching goals data:', error)
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
        percentage: 1, // 1% burn for each $100K milestone
        achieved: marketCap >= i,
        timeAboveThreshold: marketCap >= i ? 24 : 0 // Simplified - in real implementation, track actual time
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
      fetchGoalsData()
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
      name: 'Team Held',
      value: totalTeamHeld,
      percentage: totalTeamHeld > 0 ? (totalTeamHeld / (totalTeamHeld + totalTeamBurned)) * 100 : 0,
      color: '#f97316'
    },
    {
      name: 'Team Burned',
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

  if (loading && walletData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
        <div className="fixed inset-0 opacity-10" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
        </div>
        <Navbar />
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading Tokenomics Data...</h1>
            <p className="text-gray-700">Fetching live wallet balances and market data</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Enhanced Background with Multiple Layers */}
      <div className="fixed inset-0" aria-hidden="true">
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-orange-200/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-yellow-400/10" />
      </div>

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto pt-28 px-4 pb-16">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 mb-6 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-sm font-semibold text-gray-800 shadow-lg"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Live Transparency Hub
          </motion.div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight">
            Tokenomics
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-4xl mx-auto leading-relaxed font-medium">
            Real-time team wallet balances, burn progress, and community milestones.
            <br />
            <span className="text-lg text-gray-700 font-normal">Complete transparency for the $GUDTEK ecosystem.</span>
          </p>

          {/* Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center space-x-6 px-6 py-3 bg-white/25 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl"
          >
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live Data</span>
            </div>
            <div className="w-px h-4 bg-gray-600/30" />
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Clock className="w-4 h-4" />
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshData}
              className="px-4 py-2 bg-white/30 hover:bg-white/40 rounded-xl text-sm font-semibold text-gray-800 transition-all duration-200 border border-white/30 hover:border-white/50 shadow-md"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                'Refresh'
              )}
            </motion.button>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Enhanced Team Allocation Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <Card className="group bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/20 hover:border-white/40 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-yellow-500/5" />
              <CardHeader className="relative pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                  <div className="p-2 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors duration-300">
                    <Flame className="w-6 h-6 text-orange-700" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Team Allocation Status
                  </span>
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600 font-medium">Live blockchain data</span>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-72 mb-6 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
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
                      <div className="text-2xl font-black text-gray-900">
                        {formatTokenBalance(totalTeamHeld + totalTeamBurned)}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Total Team</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full shadow-lg"></div>
                      <span className="font-semibold text-gray-900">Team Held</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">{formatTokenBalance(totalTeamHeld)}</div>
                      <div className="text-sm text-gray-600">{pieData[0].percentage.toFixed(1)}% of team allocation</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-700 rounded-full shadow-lg"></div>
                      <span className="font-semibold text-gray-900">Team Burned</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">{formatTokenBalance(totalTeamBurned)}</div>
                      <div className="text-sm text-gray-600">{pieData[1].percentage.toFixed(1)}% of team allocation</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Market Cap Burn Logic */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <Card className="group bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/20 hover:border-white/40 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />
              <CardHeader className="relative pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                  <div className="p-2 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
                    <TrendingUp className="w-6 h-6 text-green-700" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Market Cap Burn Thresholds
                  </span>
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600 font-medium">Real-time market data</span>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-6">
                  {/* Current Market Cap Display */}
                  <div className="text-center p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl border border-white/30 backdrop-blur-sm">
                    <div className="text-4xl font-black text-gray-900 mb-2">
                      ${tokenData ? formatNumber(tokenData.marketCap) : '---'}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Current Market Cap</div>
                    <div className="mt-3 flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-gray-600">Live from DexScreener</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {burnThresholds.map((threshold, index) => (
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
                        <div className="flex items-center space-x-2">
                          <Badge variant={threshold.achieved ? "default" : "secondary"}>
                            {threshold.percentage}% burn
                          </Badge>
                          {threshold.achieved && threshold.timeAboveThreshold >= 24 && (
                            <Badge variant="outline" className="text-green-700 border-green-700">
                              Eligible
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-600 mt-4 p-2 bg-white/10 rounded-lg">
                    <strong>Burn Logic:</strong> For every $100K market cap milestone sustained for 24+ hours, 1% of total supply is burned.
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Team Wallets Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mb-16"
        >
          <Card className="group bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/20 hover:border-white/40 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
            <CardHeader className="relative pb-6">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                <div className="p-2 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                  <Target className="w-6 h-6 text-blue-700" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Team Wallet Breakdown
                </span>
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 font-medium">Live on-chain balances</span>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-4 px-4 font-bold text-gray-800 bg-white/10 rounded-tl-xl">Wallet</th>
                      <th className="text-right py-4 px-4 font-bold text-gray-800 bg-white/10">Balance</th>
                      <th className="text-right py-4 px-4 font-bold text-gray-800 bg-white/10">% of Supply</th>
                      <th className="text-center py-4 px-4 font-bold text-gray-800 bg-white/10 rounded-tr-xl">Solscan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletData.map((wallet, index) => (
                      <motion.tr 
                        key={wallet.address} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-white/10 hover:bg-white/10 transition-all duration-200 group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{wallet.label}</div>
                              <div className="text-sm text-gray-600 font-mono bg-gray-100/50 px-2 py-1 rounded-lg">
                                {formatAddress(wallet.address)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-4 px-4">
                          <div className="font-mono font-bold text-lg text-gray-900">
                            {formatTokenBalance(wallet.balance)}
                          </div>
                          <div className="text-xs text-gray-600">GUDTEK</div>
                        </td>
                        <td className="text-right py-4 px-4">
                          <div className="font-bold text-lg text-gray-900">
                            {wallet.percentage.toFixed(3)}%
                          </div>
                          <div className="text-xs text-gray-600">of total supply</div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <motion.a
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            href={`https://solscan.io/account/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 hover:text-blue-800 transition-all duration-200 rounded-xl border border-blue-500/30 hover:border-blue-500/50"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm font-medium">View</span>
                          </motion.a>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-white/30 bg-white/10">
                      <td className="py-5 px-4 font-bold text-gray-900 text-lg rounded-bl-xl">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full" />
                          <span>Total Team Holdings</span>
                        </div>
                      </td>
                      <td className="text-right py-5 px-4">
                        <div className="font-mono font-bold text-xl text-gray-900">{formatTokenBalance(totalTeamHeld)}</div>
                        <div className="text-sm text-gray-600">GUDTEK tokens</div>
                      </td>
                      <td className="text-right py-5 px-4">
                        <div className="font-bold text-xl text-gray-900">{((totalTeamHeld / TOTAL_SUPPLY) * 100).toFixed(3)}%</div>
                        <div className="text-sm text-gray-600">of total supply</div>
                      </td>
                      <td className="rounded-br-xl"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Community Goals */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
          <Card className="group bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/20 hover:border-white/40 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
            <CardHeader className="relative pb-6">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                <div className="p-2 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                  <Target className="w-6 h-6 text-purple-700" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Community Goals & Burns
                </span>
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 font-medium">Goal-based token burns</span>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {goalData.map((goal, index) => (
                  <motion.div 
                    key={goal.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="group/goal space-y-4 p-6 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl hover:bg-white/30 hover:border-white/40 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-gray-900">{goal.name}</h3>
                      <Badge 
                        variant="outline" 
                        className="bg-white/30 border-white/50 text-gray-800 font-semibold px-3 py-1"
                      >
                        {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
                      </Badge>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="space-y-2">
                      <div className="relative">
                        <div className="w-full bg-white/30 rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progress}%` }}
                            transition={{ duration: 1, delay: 0.8 + index * 0.1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                          </motion.div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-900 drop-shadow-sm">
                            {goal.progress.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">
                        {goal.progress >= 100 ? (
                          <div className="flex items-center space-x-1 text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>Completed!</span>
                          </div>
                        ) : (
                          `${goal.progress.toFixed(1)}% Complete`
                        )}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {goal.current.toLocaleString()} {goal.unit}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-white/20 rounded-xl border border-white/30">
                      <p className="text-sm text-gray-700 font-medium">
                        {goal.description}
                      </p>
                      {goal.progress >= 100 && (
                        <div className="mt-2 flex items-center space-x-2 text-green-700">
                          <Flame className="w-4 h-4" />
                          <span className="text-xs font-bold">BURN TRIGGERED!</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Summary Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-white/30 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Flame className="w-5 h-5 text-purple-700" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-900">Goal-Based Burns</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  When community goals are achieved, the corresponding percentage of total supply is automatically burned, 
                  reducing the circulating supply and increasing scarcity for all holders.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white/20 rounded-xl">
                    <div className="text-lg font-bold text-gray-900">{goalData.length}</div>
                    <div className="text-xs text-gray-600">Total Goals</div>
                  </div>
                  <div className="text-center p-3 bg-white/20 rounded-xl">
                    <div className="text-lg font-bold text-green-700">
                      {goalData.filter(goal => goal.progress >= 100).length}
                    </div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-white/20 rounded-xl">
                    <div className="text-lg font-bold text-orange-700">2.0%</div>
                    <div className="text-xs text-gray-600">Total Burn %</div>
                  </div>
                  <div className="text-center p-3 bg-white/20 rounded-xl">
                    <div className="text-lg font-bold text-purple-700">
                      {goalData.filter(goal => goal.progress >= 100).length * 0.5}%
                    </div>
                    <div className="text-xs text-gray-600">Achieved</div>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  )
} 