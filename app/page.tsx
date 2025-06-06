"use client"

import { useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Copy, ExternalLink, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GudTekLanding() {
  const [copied, setCopied] = useState(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.div style={{ y, opacity }} className="relative z-20">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8"
          >
            <img
              src="/images/gudtek-logo.png"
              alt="Gud Tek Logo"
              className="w-48 h-48 mx-auto rounded-full shadow-2xl"
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-7xl md:text-9xl font-black text-gray-900 mb-4 tracking-tight"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
          >
            GUD TEK
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-2xl md:text-3xl font-bold text-gray-800 mb-12 max-w-2xl mx-auto"
          >
            HACKATHON-POWERED BONK TECH.
          </motion.p>

          {/* Contract Address */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-8"
          >
            <div className="bg-yellow-100 border-2 border-gray-900 rounded-xl p-4 max-w-2xl mx-auto">
              <p className="text-sm font-bold text-gray-700 mb-2">Contract Address:</p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <code className="text-sm font-mono text-gray-900 break-all flex-1 text-center sm:text-left">
                  5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk
                </code>
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              {copied && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="mt-2 text-center text-2xl"
                >
                  ✨🎉✨
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Enhanced Button Group */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="space-y-6"
          >
            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() =>
                  window.open("https://jup.ag/swap/SOL-5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk", "_blank")
                }
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 min-w-[160px]"
              >
                <Zap className="mr-2" />
                Buy Now
              </Button>
              <Button
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-4 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 min-w-[160px]"
              >
                <TrendingUp className="mr-2" />
                View Chart
              </Button>
            </div>

            {/* Secondary CTAs */}
            <div className="flex flex-wrap gap-3 justify-center items-center">
              <Button
                variant="outline"
                onClick={() => window.open("https://x.com/ccpp911/status/1930987147504259243", "_blank")}
                className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Follow X
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Live Chart Section */}
      <section className="py-20 px-4 bg-gray-900 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-orange-400 mb-4">Live Chart 🔥</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">Track Gud Tek's price action in real-time</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gray-800 rounded-3xl p-4 shadow-2xl border border-gray-700"
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
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Buy on Raydium
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-gray-900 font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on DexScreener
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-yellow-300 to-orange-400">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">Join the Community 🚀</h2>
            <p className="text-xl text-gray-800 mb-12 max-w-2xl mx-auto">
              Follow us on X for the latest Gud Tek updates, memes, and community vibes
            </p>

            <div className="max-w-md mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl p-8 shadow-xl border-4 border-gray-900"
              >
                <div className="text-6xl mb-6">🐦</div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Follow on X</h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Join our X community and connect with fellow Gud Tek holders
                </p>
                <Button
                  onClick={() => window.open("https://x.com/i/communities/1930994127895703976", "_blank")}
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <ExternalLink className="mr-2" />
                  Join Community
                </Button>
              </motion.div>
            </div>

            {/* Featured Tweet Preview */}
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-900">
                <img
                  src="/images/tweet-screenshot.png"
                  alt="Gud Tek Hackathon Announcement"
                  className="w-full rounded-xl shadow-lg"
                />
                <Button
                  onClick={() => window.open("https://x.com/ccpp911/status/1930987147504259243", "_blank")}
                  className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl"
                >
                  View Original Post
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 border-t-4 border-orange-400">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-orange-400 font-bold text-lg">Built for fun. Gud Tek Forever 🧡</p>
        </div>
      </footer>
    </div>
  )
}
