'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, BarChart3, DollarSign } from 'lucide-react'

interface TokenData {
  priceUsd: string
  volume: {
    h24: number
  }
  marketCap: number
  priceChange: {
    h24: number
  }
}

export default function TokenStats() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const response = await fetch('https://api.dexscreener.com/tokens/v1/solana/5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk')
        const data = await response.json()
        
        if (data && data.length > 0) {
          setTokenData(data[0])
        }
      } catch (error) {
        console.error('Error fetching token data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTokenData()
    // Refresh every 60 seconds
    const interval = setInterval(fetchTokenData, 60000)

    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(2)
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    if (num < 0.001) {
      return num.toFixed(6)
    }
    return num.toFixed(4)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border-2 border-gray-900 shadow-xl">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!tokenData) {
    return null
  }

  const priceChange = tokenData.priceChange.h24
  const isPositive = priceChange > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto mb-8"
    >
      {/* Price */}
      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border-2 border-gray-900 shadow-xl hover:bg-white/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <DollarSign className="w-6 h-6 text-gray-900" />
          <span className={`text-sm font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
          </span>
        </div>
        <div className="text-2xl font-black text-gray-900">
          ${formatPrice(tokenData.priceUsd)}
        </div>
        <div className="text-sm font-bold text-gray-700">GUDTEK Price</div>
      </div>

      {/* Market Cap */}
      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border-2 border-gray-900 shadow-xl hover:bg-white/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="w-6 h-6 text-gray-900" />
          <span className="text-xs font-bold text-gray-600">24H</span>
        </div>
        <div className="text-2xl font-black text-gray-900">
          ${formatNumber(tokenData.marketCap)}
        </div>
        <div className="text-sm font-bold text-gray-700">Market Cap</div>
      </div>

      {/* Volume */}
      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border-2 border-gray-900 shadow-xl hover:bg-white/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <BarChart3 className="w-6 h-6 text-gray-900" />
          <span className="text-xs font-bold text-gray-600">24H</span>
        </div>
        <div className="text-2xl font-black text-gray-900">
          ${formatNumber(tokenData.volume.h24)}
        </div>
        <div className="text-sm font-bold text-gray-700">Volume</div>
      </div>
    </motion.div>
  )
} 