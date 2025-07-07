import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, Trophy, Users, Code, Target, ExternalLink } from "lucide-react"
import Navbar from "@/components/Navbar"
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Solana BONK Hackathon | GUD TEK First Launchpad Project',
  description: 'Learn about GUD TEK - the first project on BONK hackathon launchpad. Discover how Solana hackathons are driving memecoin innovation with good tech and community focus.',
  keywords: [
    'solana hackathon', 'bonk hackathon', 'hackathon launchpad', 'solana memecoin hackathon',
    'bonk launchpad', 'gudtek hackathon', 'solana development', 'memecoin hackathon',
    'blockchain hackathon', 'crypto hackathon', 'solana projects', 'bonk ecosystem'
  ],
  openGraph: {
    title: 'Solana BONK Hackathon | GUD TEK First Launchpad Project',
    description: 'First project on BONK hackathon launchpad. Premium Solana memecoin innovation.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://gudtek.club/solana-hackathon',
  },
}

export default function SolanaHackathonPage() {
  const hackathonSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "BONK Hackathon on Solana",
    "description": "Solana hackathon featuring BONK ecosystem projects and memecoin innovation",
    "url": "https://hackathon.letsbonk.fun",
    "organizer": {
      "@type": "Organization",
      "name": "BONK",
      "url": "https://bonk.gg"
    },
    "participant": {
      "@type": "Organization",
      "name": "GUD TEK",
      "description": "First project on BONK hackathon launchpad",
      "url": "https://gudtek.club"
    },
    "about": "Solana hackathon promoting memecoin innovation and good tech development"
  }

  return (
    <>
      <Script
        id="hackathon-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(hackathonSchema)
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500">
        <Navbar />
        
        <main className="pt-24 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <section className="text-center py-20">
              <Badge className="mb-6 bg-white/20 text-gray-900 text-lg px-6 py-2">
                🏆 BONK Hackathon Featured Project
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6">
                Solana BONK<br />Hackathon
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-3xl mx-auto">
                Discover how <strong>GUD TEK</strong> became the first project on the BONK hackathon launchpad,
                pioneering innovation in Solana memecoins with premium tech and community focus.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold">
                  <Link href="/">
                    <Rocket className="mr-2 w-5 h-5" />
                    Explore GUD TEK
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white">
                  <a href="https://hackathon.letsbonk.fun" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 w-5 h-5" />
                    Visit BONK Hackathon
                  </a>
                </Button>
              </div>
            </section>
            
            {/* What is BONK Hackathon */}
            <section className="py-16">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                    What is the BONK Hackathon?
                  </h2>
                  <p className="text-lg text-gray-800 mb-6">
                    The BONK hackathon on Solana is a revolutionary initiative that brings together developers, 
                    creators, and memecoin enthusiasts to build innovative projects on the Solana blockchain.
                  </p>
                  <p className="text-lg text-gray-800 mb-6">
                    The hackathon launchpad at <a href="https://hackathon.letsbonk.fun" className="text-orange-600 hover:underline" target="_blank" rel="noopener noreferrer">hackathon.letsbonk.fun</a> showcases 
                    cutting-edge projects that combine meme culture with serious technology.
                  </p>
                </div>
                <div className="space-y-4">
                  <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Code className="w-6 h-6 text-orange-600" />
                        <h3 className="font-bold text-gray-900">Innovation Focus</h3>
                      </div>
                      <p className="text-gray-800">Building next-gen memecoin tech on Solana</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-6 h-6 text-orange-600" />
                        <h3 className="font-bold text-gray-900">Community Driven</h3>
                      </div>
                      <p className="text-gray-800">Projects built by and for the community</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-6 h-6 text-orange-600" />
                        <h3 className="font-bold text-gray-900">Real Utility</h3>
                      </div>
                      <p className="text-gray-800">Beyond memes - actual useful applications</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
            
            {/* GUD TEK Achievement */}
            <section className="py-16">
              <Card className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-6" />
                  <h2 className="text-3xl md:text-4xl font-black mb-6">
                    GUD TEK: First on Launchpad
                  </h2>
                  <p className="text-xl mb-6 max-w-3xl mx-auto">
                    GUD TEK earned the distinction of being the <strong>first project featured</strong> on the 
                    BONK hackathon launchpad, demonstrating our commitment to good tech and community value.
                  </p>
                  <div className="grid md:grid-cols-3 gap-8 mt-12">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Premium Tech</h3>
                      <p>Advanced gaming integration with Token Dodge</p>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Strong Community</h3>
                      <p>Active Telegram and X community engagement</p>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Real Utility</h3>
                      <p>DeFi features, staking, and governance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
            
            {/* Why Solana for Hackathons */}
            <section className="py-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
                Why Solana for Memecoin Hackathons?
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 text-center">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Fast Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800">65,000+ TPS enables real-time gaming and DeFi</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 text-center">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Low Fees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800">Sub-penny transaction costs for micro-games</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 text-center">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Growing Ecosystem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800">Thriving memecoin and DeFi community</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 text-center">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Developer Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800">Robust SDKs and frameworks for innovation</p>
                  </CardContent>
                </Card>
              </div>
            </section>
            
            {/* CTA Section */}
            <section className="py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                Join the Solana Memecoin Revolution
              </h2>
              <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
                Be part of the hackathon innovation. Explore GUD TEK and see why we're leading 
                the premium memecoin movement on Solana.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold">
                  <Link href="/game">
                    Play Token Dodge
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white">
                  <Link href="/tokenomics">
                    View Tokenomics
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  )
} 