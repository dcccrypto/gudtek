"use client"

import { useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Copy, ExternalLink, TrendingUp, Zap, BarChart3, Users, Rocket, Lock, Flame, DollarSign, Target, CheckCircle, ArrowRight, Trophy, Award, Star, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import TokenStats from "@/components/TokenStats"

export default function GudTekLanding() {
  const [copied, setCopied] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false) // State for mobile nav
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3])

  const contractAddress = "5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk"

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Gud Tek",
    "description": "First ever BONK hackathon project and #1 winner on hackathon.letsbonk.fun - Revolutionary hackathon-powered BONK tech on Solana",
    "url": "https://gudtek.com",
    "logo": "https://gudtek.com/images/gudtek-logo.png",
    "sameAs": [
      "https://x.com/ccpp911/status/1930987147504259243",
      "https://x.com/i/communities/1930994127895703976",
      "https://hackathon.letsbonk.fun"
    ],
    "foundingDate": "2025",
    "industry": "Cryptocurrency",
    "keywords": "BONK, Solana, cryptocurrency, meme coin, hackathon, blockchain, DeFi, hackathon winner",
    "award": "First BONK Hackathon Winner - #1 on hackathon.letsbonk.fun"
  }

  const navItems = [
    { name: "Home", href: "#hero" },
    { name: "Hackathon", href: "#hackathon" },
    { name: "Tokenomics", href: "#tokenomics" },
    { name: "How to Buy", href: "#how-to-buy" },
    { name: "Chart", href: "#chart" },
    { name: "Memes", href: "/memes" },
    { name: "Community", href: "#community" },
    { name: "About", href: "#about" },
  ]

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
        {/* Animated Background Grid */}
        <div className="fixed inset-0 opacity-10" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
        </div>

        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 bg-white/10 backdrop-filter backdrop-blur-lg z-50 shadow-lg border-b-2 border-orange-400/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                {/* Logo/Site Title */}
                <Link href="#hero" className="flex-shrink-0 flex items-center">
                  <img
                    src="/images/gudtek-logo.png"
                    alt="Gud Tek Logo"
                    className="h-8 w-8 rounded-full mr-2"
                    width={32}
                    height={32}
                  />
                  <span className="text-gray-900 font-black text-xl tracking-tight">GUD TEK</span>
                </Link>
              </div>
              {/* Desktop Nav */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-800 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              {/* Mobile Nav Button */}
              <div className="-mr-2 flex md:hidden">
                <Button
                  onClick={() => setIsNavOpen(!isNavOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 bg-transparent hover:bg-transparent"
                  aria-controls="mobile-menu"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {!isNavOpen ? (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`${isNavOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/20 backdrop-filter backdrop-blur-lg border-t border-orange-400/30">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-800 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsNavOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Hero Section (adjust padding-top for fixed nav) */}
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center pt-24">
          <motion.div style={{ y, opacity }} className="relative z-20">
            {/* Hackathon Winner Badge - Compact */}
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="mb-6 mt-4"
            >
              <div className="bg-gradient-to-r from-yellow-300 to-orange-400 border-2 border-gray-900 rounded-xl p-2 shadow-xl max-w-xs mx-auto">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Trophy className="w-4 h-4 text-gray-900" />
                  <span className="text-sm font-black text-gray-900">#1 LEADING HACKATHON</span>
                  <Trophy className="w-4 h-4 text-gray-900" />
                </div>
                <p className="text-xs font-bold text-gray-800">First Ever BONK Hackathon Project</p>
              </div>
            </motion.div>

            {/* Logo with BONK integration */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mb-8 relative"
            >
              <div className="relative">
                <img
                  src="/images/gudtek-logo.png"
                  alt="Gud Tek Logo - #1 BONK Hackathon Winner - First hackathon-powered BONK tech on Solana"
                  className="w-48 h-48 mx-auto rounded-full shadow-2xl border-4 border-gray-900"
                  width={192}
                  height={192}
                  loading="eager"
                />
                {/* BONK Logo Corner Badge */}
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-orange-500 rounded-full border-4 border-gray-900 flex items-center justify-center shadow-xl">
                  <img
                    src="/bonk1-bonk-logo.svg"
                    alt="BONK Logo"
                    className="w-10 h-10"
                    width={40}
                    height={40}
                  />
                </div>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-7xl md:text-9xl font-black text-gray-900 mb-4 tracking-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              GUD TEK
            </motion.h1>

            {/* Subtitle with SEO Keywords */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 max-w-2xl mx-auto"
            >
              FIRST EVER BONK HACKATHON PROJECT
            </motion.h2>

            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-xl md:text-2xl font-bold text-gray-700 mb-8 max-w-2xl mx-auto"
            >
              HACKATHON-POWERED BONK TECH ON SOLANA
            </motion.h3>

            {/* Live Token Stats */}
            <TokenStats />

            {/* Contract Address Section - Simplified */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="mb-8"
            >
              <div className="bg-white/20 backdrop-blur-md border-2 border-gray-900 rounded-xl p-3 max-w-lg mx-auto shadow-lg">
                <div className="flex items-center gap-3">
                  <code 
                    className="text-xs font-mono text-gray-900 break-all flex-1 text-center"
                    title="Gud Tek Solana Contract Address"
                  >
                    {contractAddress}
                  </code>
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                    aria-label="Copy contract address to clipboard"
                  >
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
                {copied && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="mt-1 text-center text-lg"
                    role="status"
                    aria-live="polite"
                  >
                    ✨ Copied! ✨
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Primary Action Buttons - Simplified */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="space-y-4"
            >
              {/* Main CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={() =>
                    window.open("https://jup.ag/swap/SOL-5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk", "_blank")
                  }
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-12 py-4 text-xl rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-orange-400"
                  aria-label="Buy Gud Tek tokens on Jupiter"
                >
                  <ArrowRight className="mr-2" />
                  Buy $GUDTEK
                </Button>
                <Button
                  size="lg"
                  onClick={() =>
                    window.open("https://dexscreener.com/solana/AbWYapHJeWhGPQ748yqhkJqBhHiWwboFVR76m95dgW9H", "_blank")
                  }
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-8 py-4 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-gray-900"
                  aria-label="View Gud Tek price chart on DexScreener"
                >
                  <TrendingUp className="mr-2" aria-hidden="true" />
                  View Chart
                </Button>
              </div>

              {/* Secondary CTAs */}
              <div className="flex flex-wrap gap-3 justify-center items-center">
                <Button
                  variant="outline"
                  onClick={() => window.open("https://hackathon.letsbonk.fun", "_blank")}
                  className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-bold px-4 py-2 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                  aria-label="View #1 Hackathon position"
                >
                  <Trophy className="mr-2 h-4 w-4" aria-hidden="true" />
                  #1 Hackathon
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open("https://x.com/ccpp911/status/1930987147504259243", "_blank")}
                  className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-bold px-4 py-2 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                  aria-label="Follow Gud Tek on X (Twitter)"
                >
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Follow X
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Hackathon Achievement Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-yellow-400 to-orange-500 relative" id="hackathon">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                <Trophy className="inline-block mr-4" aria-hidden="true" />
                Leading the BONK Hackathon
              </h2>
              <p className="text-xl text-gray-800 max-w-3xl mx-auto">
                The first ever project on the BONK hackathon platform, currently holding the #1 position on the leaderboard
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Achievement Stats */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 border-4 border-gray-900 shadow-2xl">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center border-4 border-gray-900">
                      <span className="text-3xl font-black text-gray-900">#1</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-gray-900">Currently Leading</h3>
                      <p className="text-lg text-gray-700">hackathon.letsbonk.fun</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Star className="w-6 h-6 text-yellow-600" />
                      <span className="text-lg font-bold text-gray-800">First Ever BONK Hackathon Project</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-6 h-6 text-yellow-600" />
                      <span className="text-lg font-bold text-gray-800">Leading Innovation on Solana</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-6 h-6 text-yellow-600" />
                      <span className="text-lg font-bold text-gray-800">Top Community Choice</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={() => window.open("https://hackathon.letsbonk.fun", "_blank")}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 text-xl rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-orange-400"
                  aria-label="Visit BONK Hackathon official website"
                >
                  <ExternalLink className="mr-2" aria-hidden="true" />
                  Check Our Leaderboard Position
                </Button>
              </motion.div>

              {/* Achievement Visual with BONK logo */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-12 border-4 border-gray-900 shadow-2xl">
                  <div className="text-9xl mb-6" aria-hidden="true">🚀</div>
                  <h3 className="text-4xl font-black text-gray-900 mb-4">Making History</h3>
                  <p className="text-lg text-gray-800 leading-relaxed mb-6">
                    Gud Tek broke new ground by becoming the first project to launch on BONK's hackathon platform. 
                    We're currently leading the competition and setting the standard for innovation in the Solana ecosystem.
                  </p>
                  {/* BONK Logo Integration */}
                  <div className="flex items-center justify-center space-x-3 mb-6">
                    <span className="text-2xl font-black text-gray-900">Built on</span>
                    <img
                      src="/bonk1-bonk-logo.svg"
                      alt="BONK Logo"
                      className="w-12 h-12"
                      width={48}
                      height={48}
                    />
                    <span className="text-2xl font-black text-gray-900">BONK</span>
                  </div>
                  <div className="bg-yellow-300 rounded-2xl p-6 border-4 border-gray-900">
                    <p className="text-2xl font-black text-gray-900 mb-2">LEADING THE RACE</p>
                    <p className="text-sm font-bold text-gray-700">First & #1 on hackathon.letsbonk.fun</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tokenomics Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-orange-300/50 to-yellow-300/50 backdrop-filter backdrop-blur-sm relative" id="tokenomics">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                <DollarSign className="inline-block mr-4" aria-hidden="true" />
                Gud Tek Tokenomics
              </h2>
              <p className="text-xl text-gray-800 max-w-3xl mx-auto">
                Transparent, secure, and community-focused tokenomics designed for long-term sustainability and growth
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Total Supply */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl p-6 text-center shadow-xl border-2 border-orange-300"
              >
                <Target className="w-12 h-12 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-black text-white mb-2">Total Supply</h3>
                <p className="text-4xl font-black text-white">1B</p>
                <p className="text-orange-100 mt-2">Fixed Supply</p>
              </motion.div>

              {/* LP Burned */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-center shadow-xl border-2 border-yellow-300"
              >
                <Flame className="w-12 h-12 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-black text-white mb-2">LP Status</h3>
                <p className="text-3xl font-black text-white">100% BURNED</p>
                <p className="text-yellow-100 mt-2">Permanently Locked</p>
              </motion.div>

              {/* Dev Tokens */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-orange-600 to-yellow-600 rounded-2xl p-6 text-center shadow-xl border-2 border-orange-300"
              >
                <Lock className="w-12 h-12 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-black text-white mb-2">Dev Tokens</h3>
                <p className="text-3xl font-black text-white">LOCKED</p>
                <p className="text-orange-100 mt-2">Team Commitment</p>
              </motion.div>
            </div>

            {/* Tokenomics Details */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/20 backdrop-filter backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-2 border-orange-400/50"
            >
              <h3 className="text-3xl font-black text-gray-900 mb-6 text-center">Why Gud Tek Tokenomics Are Superior</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Liquidity Pool Burned</h4>
                      <p className="text-gray-800">100% of LP tokens permanently destroyed, ensuring no rug pull possibility</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Dev Tokens Secured</h4>
                      <p className="text-gray-800">All developer allocations locked, demonstrating long-term commitment</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Fixed Supply Model</h4>
                      <p className="text-gray-800">1 billion token cap with no inflation or additional minting</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Community-Owned</h4>
                      <p className="text-gray-800">Fair launch with community holding majority of supply</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Solana Efficiency</h4>
                      <p className="text-gray-800">Built on Solana for fast, low-cost transactions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Transparent Ecosystem</h4>
                      <p className="text-gray-800">All transactions and tokenomics publicly verifiable on-chain</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How to Buy Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-orange-500 to-yellow-500 relative" id="how-to-buy">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                How to Buy Gud Tek
              </h2>
              <p className="text-xl text-gray-800 max-w-2xl mx-auto">
                Get started with Gud Tek in just a few simple steps
              </p>
            </motion.div>

            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Get a Solana Wallet",
                  description: "Download Phantom, Solflare, or any Solana-compatible wallet",
                  icon: <DollarSign className="w-8 h-8" />
                },
                {
                  step: "2", 
                  title: "Buy SOL",
                  description: "Purchase SOL on any major exchange and transfer to your wallet",
                  icon: <DollarSign className="w-8 h-8" />
                },
                {
                  step: "3",
                  title: "Connect to Jupiter",
                  description: "Visit Jupiter DEX and connect your Solana wallet",
                  icon: <Zap className="w-8 h-8" />
                },
                {
                  step: "4",
                  title: "Swap SOL for GUD TEK",
                  description: "Paste our contract address and swap your SOL for GUD TEK tokens",
                  icon: <TrendingUp className="w-8 h-8" />
                }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-6 bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-900 shadow-xl"
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-gray-900 font-black text-xl border-2 border-gray-900">
                    {item.step}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-800">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-gray-900">
                    {item.icon}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button
                size="lg"
                onClick={() =>
                  window.open("https://jup.ag/swap/SOL-5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk", "_blank")
                }
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-12 py-4 text-xl rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-orange-400"
              >
                <ArrowRight className="mr-2" />
                Start Buying Now
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Live Chart Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-yellow-300/40 to-orange-300/40 backdrop-filter backdrop-blur-sm relative" id="chart">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">
                <BarChart3 className="inline-block mr-4" aria-hidden="true" />
                Live Gud Tek Chart
              </h2>
              <p className="text-xl text-gray-800 max-w-2xl mx-auto">
                Track Gud Tek's real-time price action and trading volume on Solana DEX
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/20 backdrop-filter backdrop-blur-lg rounded-3xl p-4 shadow-2xl border-2 border-orange-400/50"
            >
              <div className="relative w-full overflow-hidden rounded-2xl bg-black">
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "0",
                    paddingBottom: "56.25%", // 16:9 aspect ratio
                  }}
                >
                  <iframe
                    src="https://dexscreener.com/solana/AbWYapHJeWhGPQ748yqhkJqBhHiWwboFVR76m95dgW9H?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15"
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      top: "0",
                      left: "0",
                      border: "0",
                      borderRadius: "1rem",
                    }}
                    allow="clipboard-write"
                    loading="lazy"
                    title="Gud Tek Live Trading Chart on DexScreener"
                  />
                </div>
              </div>

              {/* Chart CTAs */}
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <Button
                  size="lg"
                  onClick={() =>
                    window.open("https://jup.ag/swap/SOL-5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk", "_blank")
                  }
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-orange-400"
                  aria-label="Buy Gud Tek on Jupiter DEX"
                >
                  <TrendingUp className="mr-2 h-4 w-4" aria-hidden="true" />
                  Buy on Jupiter
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    window.open("https://dexscreener.com/solana/AbWYapHJeWhGPQ748yqhkJqBhHiWwboFVR76m95dgW9H", "_blank")
                  }
                  className="border-2 border-orange-600 text-orange-700 hover:bg-orange-500 hover:text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 bg-white/30 backdrop-filter backdrop-blur-sm"
                  aria-label="View detailed chart on DexScreener"
                >
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  View on DexScreener
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Community Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-yellow-300 to-orange-400 relative" id="community">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                <Users className="inline-block mr-4" aria-hidden="true" />
                Join the Gud Tek Community
              </h2>
              <p className="text-xl text-gray-800 mb-12 max-w-2xl mx-auto">
                Connect with fellow Gud Tek holders, get latest updates, share memes, and experience the best of BONK tech on Solana
              </p>

              <div className="max-w-md mx-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-8 shadow-xl border-4 border-gray-900"
                >
                  {/* Updated X Logo */}
                  <div className="text-6xl mb-6 flex justify-center" aria-hidden="true">
                    <img
                      src="/x (1).svg"
                      alt="X (Twitter) Logo"
                      className="w-16 h-16"
                      width={64}
                      height={64}
                    />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">Follow on X</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    Join our vibrant X community for real-time updates, trading insights, and exclusive Gud Tek content
                  </p>
                  <Button
                    onClick={() => window.open("https://x.com/i/communities/1930994127895703976", "_blank")}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-orange-400"
                    aria-label="Join Gud Tek community on X"
                  >
                    <ExternalLink className="mr-2" aria-hidden="true" />
                    Join Community
                  </Button>
                </motion.div>
              </div>

              {/* Featured Tweet Preview */}
              <div className="mt-12 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Latest from Gud Tek</h3>
                <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-900">
                  <img
                    src="/images/tweet-screenshot.png"
                    alt="Gud Tek Hackathon Announcement on X"
                    className="w-full rounded-xl shadow-lg"
                    loading="lazy"
                  />
                  <Button
                    onClick={() => window.open("https://x.com/ccpp911/status/1930987147504259243", "_blank")}
                    className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl border-2 border-gray-900"
                    aria-label="View original announcement post on X"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                    View Original Post
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-orange-300/40 to-yellow-300/40 backdrop-filter backdrop-blur-sm relative" id="about">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                <Rocket className="inline-block mr-4" aria-hidden="true" />
                About Gud Tek
              </h2>
              <div className="text-left space-y-6 text-gray-800 text-lg leading-relaxed bg-white/30 backdrop-filter backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-2 border-orange-400/50">
                <p>
                  <strong className="text-orange-700">Gud Tek</strong> is the <strong className="text-orange-600">first ever project on the BONK hackathon</strong> and we claimed the <strong className="text-orange-600">#1 spot on hackathon.letsbonk.fun</strong>. We made history, and now we're determined to build on that success.
                </p>
                <p>
                  We're already at the top, but that's just the beginning. Our team is focused on proving to the community that we deserve this position and we plan to stay there. No fancy promises, just solid work and results.
                </p>
                <p>
                  Built on Solana for fast, low-cost transactions. Our tokenomics are transparent - LP burned, dev tokens locked, and everything is verifiable on-chain. We keep it simple and we keep it real.
                </p>
                <p>
                  <strong className="text-orange-700">Contract Address:</strong> {contractAddress}
                </p>
                <p>
                  Join the community that believes in building something lasting. We're not here to disappear - we're here to prove that hackathon winners can deliver real value.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 bg-white/20 backdrop-filter backdrop-blur-lg border-t-4 border-orange-400/50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img
                src="/bonk1-bonk-logo.svg"
                alt="BONK Logo"
                className="w-8 h-8"
                width={32}
                height={32}
              />
              <p className="text-orange-700 font-bold text-lg">
                Built with passion for the future of DeFi. Gud Tek Forever 🧡
              </p>
            </div>
            <div className="text-gray-700 text-sm space-y-2">
              <p>© 2025 Gud Tek. All rights reserved.</p>
              <p>
                <strong>Disclaimer:</strong> Cryptocurrency investments carry risk. Please do your own research before investing.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
