'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const faqs = [
  {
    id: 'what-is-gudtek',
    question: 'What is Gud Tek?',
    answer: 'Gud Tek is the #1 winner of the first BONK hackathon on Solana. We\'re a community-driven project that combines gaming with DeFi, featuring our Token Dodge game and $GUDTEK token.'
  },
  {
    id: 'how-to-play-game',
    question: 'How do I play the Token Dodge game?',
    answer: 'Connect your wallet, hold minimum $GUDTEK tokens, then visit the Game page. Use arrow keys or WASD to move your character, collect tokens, and avoid obstacles. Top weekly players get airdrops!'
  },
  {
    id: 'wallet-requirements',
    question: 'What do I need to participate?',
    answer: 'You need a Solana wallet (like Phantom) with some $GUDTEK tokens. Different activities have different requirements - check the specific minimums on each page.'
  },
  {
    id: 'how-to-buy',
    question: 'How do I buy $GUDTEK tokens?',
    answer: 'Get SOL in your Solana wallet, then swap it for $GUDTEK on Jupiter DEX or other Solana exchanges. Our contract address is available on the main page.'
  },
  {
    id: 'community-participation',
    question: 'How can I join the community?',
    answer: 'Join our Telegram and follow us on X (Twitter) for updates, discussions, and community events. Links are in the Community section.'
  },
  {
    id: 'meme-contests',
    question: 'What are the meme contests?',
    answer: 'Weekly meme competitions where community members submit and vote on memes. Winners get $GUDTEK rewards. You need minimum tokens to vote and submit.'
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

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-orange-300/40 to-yellow-300/40 backdrop-filter backdrop-blur-sm relative">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-full px-6 py-3 mb-6 shadow-lg">
            <HelpCircle className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-700">
            Quick answers to common questions about Gud Tek
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
              <Card className={`bg-white border-2 transition-all duration-200 shadow-sm hover:shadow-lg ${openItems.includes(faq.id) ? 'border-orange-500' : 'border-orange-200 hover:border-orange-400'}`}>
                <CardHeader className="pb-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto text-left hover:bg-transparent"
                    onClick={() => toggleItem(faq.id)}
                  >
                    <CardTitle className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </CardTitle>
                    {openItems.includes(faq.id) ? (
                      <ChevronUp className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    )}
                  </Button>
                </CardHeader>
                
                {openItems.includes(faq.id) && (
                  <CardContent className="pt-0 bg-white/90 border-t border-orange-100">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-800 leading-relaxed"
                    >
                      {faq.answer}
                    </motion.div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Simple CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Card className="bg-gradient-to-r from-orange-600 to-pink-600 border-0 shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Still have questions?
              </h3>
              <p className="text-white/90 mb-6">
                Join our community for help and updates!
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  asChild
                  className="bg-white text-orange-600 hover:bg-gray-100 font-semibold border-2 border-orange-500"
                >
                  <a href="https://t.me/gudtekclub" target="_blank" rel="noopener noreferrer">
                    Join Telegram
                  </a>
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-orange-600 font-semibold focus-visible:ring-2 focus-visible:ring-white"
                >
                  <a href="https://x.com/i/communities/1930994127895703976" target="_blank" rel="noopener noreferrer">
                    Follow X
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
} 