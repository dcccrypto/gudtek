'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Script from 'next/script'

const blogPosts = [
  {
    id: 'gudtek-solana-memecoin-guide',
    title: 'Complete Guide to GUDTEK: The Premium Solana Memecoin',
    excerpt: 'Everything you need to know about GUDTEK token, including how to buy, tokenomics, and why it\'s the best Solana memecoin in 2024.',
    author: 'GUDTEK Team',
    date: '2024-01-15',
    category: 'Education',
    readTime: '5 min read',
    image: '/images/blog/gudtek-guide.png',
    slug: 'gudtek-solana-memecoin-guide',
    tags: ['gudtek', 'solana', 'memecoin', 'tutorial', 'cryptocurrency']
  },
  {
    id: 'token-dodge-game-strategy',
    title: 'Token Dodge Game: Pro Tips to Maximize Your Earnings',
    excerpt: 'Master the art of Token Dodge with these expert strategies. Learn how to achieve high scores and maximize your weekly airdrop rewards.',
    author: 'Gaming Expert',
    date: '2024-01-10',
    category: 'Gaming',
    readTime: '4 min read',
    image: '/images/blog/token-dodge-tips.png',
    slug: 'token-dodge-game-strategy',
    tags: ['token dodge', 'gaming', 'strategy', 'play to earn', 'solana game']
  },
  {
    id: 'solana-vs-ethereum-memecoins',
    title: 'Solana vs Ethereum: Why Solana Memecoins Are Winning in 2024',
    excerpt: 'Deep dive into why Solana memecoins like GUDTEK are outperforming Ethereum alternatives. Fees, speed, and ecosystem comparison.',
    author: 'DeFi Analyst',
    date: '2024-01-08',
    category: 'Analysis',
    readTime: '6 min read',
    image: '/images/blog/solana-vs-ethereum.png',
    slug: 'solana-vs-ethereum-memecoins',
    tags: ['solana', 'ethereum', 'comparison', 'defi', 'blockchain']
  },
  {
    id: 'memecoin-investing-guide-2024',
    title: 'Memecoin Investing Guide 2024: Finding Gems Like GUDTEK',
    excerpt: 'Learn how to identify promising memecoins with real utility. Research methods, red flags to avoid, and why community matters.',
    author: 'Crypto Strategist',
    date: '2024-01-05',
    category: 'Investment',
    readTime: '7 min read',
    image: '/images/blog/memecoin-investing.png',
    slug: 'memecoin-investing-guide-2024',
    tags: ['investing', 'memecoin', 'research', 'crypto strategy', 'dyor']
  }
]

export default function SEOBlogSection() {
  // Blog Schema for SEO
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "GUDTEK Blog",
    "description": "Latest insights on Solana memecoins, crypto gaming, and blockchain technology",
    "url": "https://gudtek.club/blog",
    "blogPost": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": `https://gudtek.club${post.image}`,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "GUD TEK",
        "logo": {
          "@type": "ImageObject",
          "url": "https://gudtek.club/images/gudtek-logo.png"
        }
      },
      "datePublished": post.date,
      "dateModified": post.date,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://gudtek.club/blog/${post.slug}`
      },
      "keywords": post.tags.join(", ")
    }))
  }

  return (
    <>
      <Script
        id="blog-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogSchema)
        }}
      />
      
      <section id="blog" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border-2 border-gray-900/20 rounded-full px-6 py-3 mb-6 shadow-xl">
              <BookOpen className="w-6 h-6 text-gray-900" />
              <span className="text-lg font-black text-gray-900">GUDTEK INSIGHTS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Learn & Earn with Crypto
            </h2>
            <p className="text-xl text-gray-800 max-w-2xl mx-auto">
              Expert insights on Solana memecoins, DeFi strategies, and blockchain gaming
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-2xl transition-all duration-300 bg-white/20 backdrop-blur-lg border-2 border-gray-900/20 hover:border-gray-900/40 transform hover:scale-105 h-full">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <p className="text-gray-800 text-sm line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="bg-gray-200/50 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{post.readTime}</span>
                      <Button
                        asChild
                        size="sm"
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold"
                      >
                        <Link href={`/blog/${post.slug}`}>
                          Read More
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-16"
          >
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-4 border-yellow-400 shadow-2xl">
              <CardContent className="p-8">
                <h3 className="text-3xl font-black text-white mb-4">
                  Stay Updated with GUDTEK
                </h3>
                <p className="text-white/90 mb-6 text-lg">
                  Get the latest insights on Solana memecoins, gaming updates, and exclusive alpha!
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    asChild
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100 font-bold"
                  >
                    <Link href="/blog">
                      <BookOpen className="w-5 h-5 mr-2" />
                      View All Articles
                    </Link>
                  </Button>
                  <Button 
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600 font-bold"
                  >
                    <a href="https://t.me/gudtek_official" target="_blank" rel="noopener noreferrer">
                      Join Community
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