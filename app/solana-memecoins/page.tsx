import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Zap, Shield, Gamepad2, DollarSign, Users, Star, ArrowRight } from "lucide-react"
import Navbar from "@/components/Navbar"
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Solana Memecoins Guide | GUD TEK Premium Tech | Best SOL Tokens',
  description: 'Complete guide to Solana memecoins featuring GUD TEK - premium memecoin with good tech, gaming utilities, and strong community. Learn about the best Solana tokens.',
  keywords: [
    'solana memecoins', 'solana memecoin', 'gud tek', 'good tech', 'premium tech',
    'best solana tokens', 'solana tokens', 'memecoin with utility', 'sol memecoins',
    'bonk solana', 'solana gaming tokens', 'defi memecoins', 'solana ecosystem'
  ],
  openGraph: {
    title: 'Solana Memecoins Guide | GUD TEK Premium Tech',
    description: 'Discover the best Solana memecoins featuring premium tech and real utility.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://gudtek.club/solana-memecoins',
  },
}

export default function SolanaMemecoinsPage() {
  const memecoinsSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Complete Guide to Solana Memecoins with Good Tech",
    "description": "Comprehensive guide to the best Solana memecoins, featuring premium technology and real utility",
    "author": {
      "@type": "Organization",
      "name": "GUD TEK Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "GUD TEK",
      "logo": {
        "@type": "ImageObject",
        "url": "https://gudtek.club/images/gudtek-logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://gudtek.club/solana-memecoins"
    },
    "about": [
      {
        "@type": "Thing",
        "name": "Solana Memecoins"
      },
      {
        "@type": "CryptoCurrency",
        "name": "GUDTEK",
        "alternateName": "$GUDTEK"
      }
    ]
  }

  const topMemecoins = [
    {
      name: "GUD TEK",
      symbol: "$GUDTEK",
      description: "First project on BONK hackathon launchpad with premium tech",
      features: ["Gaming Utilities", "DeFi Integration", "Community Governance", "Premium Tech"],
      status: "Featured",
      color: "from-orange-500 to-yellow-500"
    },
    {
      name: "BONK",
      symbol: "$BONK",
      description: "The original Solana community memecoin",
      features: ["Community Focused", "Ecosystem Partnerships", "Burn Mechanics", "Wide Adoption"],
      status: "Established",
      color: "from-red-500 to-pink-500"
    },
    {
      name: "SAMO",
      symbol: "$SAMO",
      description: "Solana's native memecoin with strong community",
      features: ["Long History", "NFT Integration", "Staking Rewards", "Community DAOs"],
      status: "Veteran",
      color: "from-blue-500 to-purple-500"
    }
  ]

  return (
    <>
      <Script
        id="memecoins-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(memecoinsSchema)
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500">
        <Navbar />
        
        <main className="pt-24 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <section className="text-center py-20">
              <Badge className="mb-6 bg-white/20 text-gray-900 text-lg px-6 py-2">
                🚀 Premium Solana Memecoins Guide
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6">
                Solana<br />Memecoins
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-4xl mx-auto">
                Discover the best <strong>Solana memecoins</strong> with <strong>good tech</strong> and real utility. 
                From gaming tokens to DeFi memecoins, explore the premium projects driving innovation.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center mb-12">
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold">
                  <Link href="#top-memecoins">
                    <TrendingUp className="mr-2 w-5 h-5" />
                    Explore Top Memecoins
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white">
                  <Link href="#why-solana">
                    Learn About Solana
                  </Link>
                </Button>
              </div>
            </section>
            
            {/* Why Solana for Memecoins */}
            <section id="why-solana" className="py-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
                Why Solana is Perfect for Memecoins
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 text-center group hover:scale-105 transition-transform">
                  <CardHeader>
                    <Zap className="w-12 h-12 mx-auto text-orange-600 mb-4" />
                    <CardTitle className="text-gray-900">Lightning Fast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800">65,000+ TPS enables instant memecoin transactions</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 text-center group hover:scale-105 transition-transform">
                  <CardHeader>
                    <DollarSign className="w-12 h-12 mx-auto text-green-600 mb-4" />
                    <CardTitle className="text-gray-900">Ultra Low Fees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800">Fractions of a penny per transaction</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 text-center group hover:scale-105 transition-transform">
                  <CardHeader>
                    <Users className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                    <CardTitle className="text-gray-900">Strong Ecosystem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800">Thriving community of builders and traders</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 text-center group hover:scale-105 transition-transform">
                  <CardHeader>
                    <Shield className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                    <CardTitle className="text-gray-900">Good Tech</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800">Robust infrastructure for premium projects</p>
                  </CardContent>
                </Card>
              </div>
            </section>
            
            {/* Top Solana Memecoins */}
            <section id="top-memecoins" className="py-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
                Top Solana Memecoins with Premium Tech
              </h2>
              
              <div className="space-y-8">
                {topMemecoins.map((coin, index) => (
                  <Card key={coin.symbol} className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${coin.color}`} />
                    <CardContent className="p-8">
                      <div className="grid md:grid-cols-3 gap-8 items-center">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-2xl font-black text-gray-900">{coin.name}</h3>
                            <Badge className={`bg-gradient-to-r ${coin.color} text-white`}>
                              {coin.status}
                            </Badge>
                          </div>
                          <p className="text-lg text-gray-800 mb-4">{coin.description}</p>
                          <p className="text-xl font-bold text-orange-600">{coin.symbol}</p>
                        </div>
                        
                        <div className="md:col-span-2">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">Key Features:</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {coin.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                <span className="text-gray-800">{feature}</span>
                              </div>
                            ))}
                          </div>
                          
                          {index === 0 && (
                            <div className="mt-6">
                              <Button asChild className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold">
                                <Link href="/">
                                  <ArrowRight className="mr-2 w-4 h-4" />
                                  Explore GUD TEK
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            
            {/* What Makes a Good Memecoin */}
            <section className="py-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
                What Makes a Memecoin Have "Good Tech"?
              </h2>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <Card className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0">
                    <CardContent className="p-8">
                      <Gamepad2 className="w-16 h-16 mb-6" />
                      <h3 className="text-2xl font-bold mb-4">Gaming Integration</h3>
                      <p className="text-lg">
                        Premium memecoins like GUD TEK integrate gaming utilities, 
                        creating real engagement beyond just holding tokens.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">✅ Real Utility</h3>
                    <p className="text-gray-800">Beyond memes - staking, governance, gaming, and DeFi features</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">✅ Strong Community</h3>
                    <p className="text-gray-800">Active development team and engaged community members</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">✅ Transparent Tokenomics</h3>
                    <p className="text-gray-800">Clear distribution, fair launch, and sustainable economics</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">✅ Innovation Focus</h3>
                    <p className="text-gray-800">Pushing boundaries with new features and partnerships</p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* CTA Section */}
            <section className="py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                Start Your Solana Memecoin Journey
              </h2>
              <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
                Join the premium memecoin revolution with GUD TEK. Experience gaming, 
                DeFi, and community governance in one innovative package.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold">
                  <a href="https://jup.ag/swap/SOL-5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk" target="_blank" rel="noopener noreferrer">
                    Buy $GUDTEK Now
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white">
                  <Link href="/game">
                    Play Token Dodge
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