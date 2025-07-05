'use client'

import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import TokenStats from '@/components/TokenStats'

export default function TokenStatsUtilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      <Navbar />

      <main className="relative z-10 flex flex-col items-center pt-24 px-4">
        <h1 className="text-5xl md:text-6xl font-black mb-6">Token Stats</h1>
        <p className="text-lg md:text-xl text-gray-800 mb-10 text-center max-w-xl">
          Live $GUDTEK price, market cap and volume data pulled directly from the blockchain.
        </p>

        <TokenStats />
      </main>

      <SiteFooter />
    </div>
  )
} 