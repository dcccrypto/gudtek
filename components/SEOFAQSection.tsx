'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Script from 'next/script'

const faqs = [
  {
    id: 'what-is-gudtek-solana',
    question: 'What is GUDTEK and why is it the best Solana memecoin?',
    answer: 'GUDTEK ($GUDTEK) is a premium Solana memecoin designed for crypto enthusiasts. Built on the high-performance Solana blockchain, GUDTEK offers lightning-fast transactions, minimal fees, and an engaging gaming ecosystem with Token Dodge. Our community-driven approach and innovative play-to-earn mechanics make GUDTEK stand out in the crowded memecoin space.',
    keywords: ['gudtek', 'solana memecoin', 'best solana token', 'crypto community']
  },
  {
    id: 'how-to-buy-gudtek-solana',
    question: 'How do I buy GUDTEK tokens on Solana?',
    answer: 'To buy GUDTEK tokens: 1) Set up a Solana wallet (Phantom, Solflare, or Backpack), 2) Fund your wallet with SOL, 3) Connect to a Solana DEX like Jupiter or Raydium, 4) Swap SOL for GUDTEK tokens using our contract address. Always verify the official contract address on our website to avoid scams.',
    keywords: ['buy gudtek', 'solana dex', 'how to buy solana tokens', 'phantom wallet']
  },
  {
    id: 'token-dodge-game-solana',
    question: 'What is Token Dodge and how does it work?',
    answer: 'Token Dodge is our signature play-to-earn game where players collect GUDTEK tokens while avoiding crypto scams and obstacles. Built on Solana for instant gameplay, players need to hold minimum GUDTEK tokens to play. Weekly airdrops reward top performers, making it both fun and profitable for our community.',
    keywords: ['token dodge game', 'play to earn solana', 'crypto gaming', 'solana game']
  },
  {
    id: 'solana-vs-ethereum-memecoins',
    question: 'Why choose Solana memecoins over Ethereum memecoins?',
    answer: 'Solana memecoins like GUDTEK offer several advantages: ultra-low transaction fees (under $0.01), lightning-fast confirmations (under 1 second), better scalability, and an active DeFi ecosystem. Unlike Ethereum where gas fees can be $50+, Solana enables micro-transactions perfect for gaming and frequent trading.',
    keywords: ['solana vs ethereum', 'solana advantages', 'low fees crypto', 'fast blockchain']
  },
  {
    id: 'gudtek-tokenomics-supply',
    question: 'What are GUDTEK tokenomics and total supply?',
    answer: 'GUDTEK features a deflationary tokenomics model with a fixed total supply. Our transparent token distribution includes community rewards, gaming incentives, liquidity provisions, and development funds. Check our real-time supply data via our API endpoints and verify all information on Solana blockchain explorers.',
    keywords: ['gudtek tokenomics', 'token supply', 'deflationary crypto', 'solana token stats']
  },
  {
    id: 'solana-memecoin-community',
    question: 'How do I join the GUDTEK community?',
    answer: 'Join our vibrant community on Telegram and Twitter for the latest updates, memes, trading discussions, and exclusive events. Participate in our weekly game competitions, share your victories, and connect with fellow Solana enthusiasts. Our community is the heart of GUDTEK ecosystem.',
    keywords: ['crypto community', 'solana community', 'telegram crypto', 'twitter crypto']
  },
  {
    id: 'solana-wallet-setup',
    question: 'Which Solana wallet should I use for GUDTEK?',
    answer: 'We recommend Phantom (mobile & browser), Solflare (advanced features), or Backpack (newest). All support GUDTEK tokens and our Token Dodge game. Ensure you backup your seed phrase securely and never share it. Always download wallets from official sources to avoid malware.',
    keywords: ['solana wallet', 'phantom wallet', 'solflare wallet', 'crypto wallet security']
  },
  {
    id: 'gudtek-roadmap-future',
    question: 'What\'s next for GUDTEK? Future roadmap?',
    answer: 'Our roadmap includes expanding the gaming ecosystem, additional play-to-earn mechanics, cross-chain bridges, NFT integration, and partnerships with major Solana projects. We\'re building the ultimate memecoin gaming platform that combines entertainment with real rewards.',
    keywords: ['crypto roadmap', 'solana gaming future', 'nft integration', 'cross chain']
  }
]

export default function SEOFAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
      
      <section id="faq" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border-2 border-gray-900/20 rounded-full px-6 py-3 mb-6 shadow-xl">
              <HelpCircle className="w-6 h-6 text-gray-900" />
              <span className="text-lg font-black text-gray-900">FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Everything About GUDTEK
            </h2>
            <p className="text-xl text-gray-800 max-w-2xl mx-auto">
              Your complete guide to Solana's premium memecoin ecosystem
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 hover:border-gray-900/40 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-0 h-auto text-left hover:bg-transparent"
                      onClick={() => toggleItem(faq.id)}
                    >
                      <CardTitle className="text-lg font-bold text-gray-900 pr-4">
                        {faq.question}
                      </CardTitle>
                      {openItems.includes(faq.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-900 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-900 flex-shrink-0" />
                      )}
                    </Button>
                  </CardHeader>
                  
                  {openItems.includes(faq.id) && (
                    <CardContent className="pt-0">
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-gray-800 font-medium leading-relaxed"
                      >
                        {faq.answer}
                      </motion.div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-4 border-yellow-400 shadow-2xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-black text-white mb-4">
                  Still Have Questions?
                </h3>
                <p className="text-white/90 mb-6">
                  Join our community for instant answers and the latest GUDTEK updates!
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    asChild
                    className="bg-white text-purple-600 hover:bg-gray-100 font-bold"
                  >
                    <a href="https://t.me/gudtek_official" target="_blank" rel="noopener noreferrer">
                      Join Telegram
                    </a>
                  </Button>
                  <Button 
                    asChild
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-purple-600 font-bold"
                  >
                    <a href="https://twitter.com/gudtek_official" target="_blank" rel="noopener noreferrer">
                      Follow Twitter
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </>
  )
} 