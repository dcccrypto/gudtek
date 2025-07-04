"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Navbar from "@/components/Navbar"
import SiteFooter from "@/components/SiteFooter"

export default function GamesPage() {
  const games = [
    {
      name: "Chess",
      href: "/chess",
      description: "Play real-time Gud Tek chess against other holders.",
      img: "/images/gudtek-logo.png" // placeholder
    },
    {
      name: "Token Dodge",
      href: "/game",
      description: "Arcade mini-game – dodge the rugs & collect $GUD!",
      img: "/game/bear.png" // correct path inside /public
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Animated Background Grid for visual consistency */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Shared Navbar */}
      <Navbar />

      {/* Page content */}
      <div className="relative z-10 max-w-5xl mx-auto pt-24 px-4 flex flex-col gap-6">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">Games</h1>
        <p className="text-lg md:text-xl text-gray-800 mb-8">Choose a game below to start playing <span role="img" aria-label="rocket">🚀</span></p>

        <div className="grid gap-8 sm:grid-cols-2">
          {games.map(game => (
            <Card
              key={game.name}
              className="flex flex-col bg-white/60 border border-white/40 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <CardHeader>
                <CardTitle className="text-3xl font-extrabold mb-1 text-gray-900 drop-shadow-sm">
                  {game.name}
                </CardTitle>
                <CardDescription className="text-gray-700 text-sm">
                  {game.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col items-center justify-center py-8">
                <Image
                  src={game.img}
                  alt={game.name}
                  width={140}
                  height={140}
                  className="object-contain drop-shadow-lg"
                />
              </CardContent>

              <div className="p-4 pt-0">
                <Link href={game.href} className="w-full" aria-label={`Play ${game.name}`}>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold shadow-md">
                    Play {game.name}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Coming soon banner */}
        <div className="mt-16 text-center text-gray-800 font-medium">
          🚧 More games are in development – check back soon!
        </div>
      </div>

      {/* Site-wide footer */}
      <SiteFooter />
    </div>
  )
} 