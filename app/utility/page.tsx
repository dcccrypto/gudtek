'use client'

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function UtilityHubPage() {
  const utilities = [
    {
      name: 'Wallet Cleaner',
      href: '/utility/clean-wallet',
      description: 'Close empty token accounts & reclaim SOL rent.',
      img: '/utility/walletcleaner.png'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Shared Navbar */}
      <Navbar />

      {/* Page Content */}
      <div className="relative z-10 max-w-5xl mx-auto pt-24 px-4 flex flex-col gap-6">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">Utilities</h1>
        <p className="text-lg md:text-xl text-gray-800 mb-8">Select a utility below to get started ⚙️</p>

        <div className="grid gap-8 sm:grid-cols-2">
          {utilities.map((util) => (
            <Card
              key={util.name}
              className="flex flex-col bg-white/60 border border-white/40 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <CardHeader>
                <CardTitle className="text-3xl font-extrabold mb-1 text-gray-900 drop-shadow-sm">
                  {util.name}
                </CardTitle>
                <CardDescription className="text-gray-700 text-sm">
                  {util.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col items-center justify-center py-8">
                {util.img ? (
                  <Image
                    src={util.img}
                    alt={util.name}
                    width={140}
                    height={140}
                    className="object-contain drop-shadow-lg"
                  />
                ) : (
                  <div className="h-[140px]" />
                )}
              </CardContent>

              <div className="p-4 pt-0">
                <Link href={util.href} className="w-full" aria-label={`Open ${util.name}`}>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold shadow-md">
                    Open {util.name}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Coming soon banner */}
        <div className="mt-16 text-center text-gray-800 font-medium">
          🚧 More utilities are in development – check back soon!
        </div>
      </div>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}