'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Heart, Upload, Wallet, Trophy, Calendar, Users, AlertCircle, CheckCircle, Menu, X, Home, MessageSquare } from 'lucide-react'
import { supabase, type Meme, type User, type WeeklyContest, uploadMemeImage } from '@/lib/supabase'
import { FileUpload } from '@/components/ui/file-upload'
import FeedbackForm from '@/components/FeedbackForm'
import { 
  getWalletInfo, 
  checkVotingEligibility, 
  checkSubmissionEligibility, 
  formatTokenBalance, 
  formatSolBalance,
  MIN_GUDTEK_BALANCE,
  testConnection
} from '@/lib/wallet'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function MemesPage() {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  
  const [memes, setMemes] = useState<(Meme & { hasUserVoted?: boolean })[]>([])
  const [currentContest, setCurrentContest] = useState<WeeklyContest | null>(null)
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [votingLoading, setVotingLoading] = useState<string | null>(null)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  
  // Wallet info state
  const [walletInfo, setWalletInfo] = useState({
    gudtekBalance: 0,
    solBalance: 0,
    canVote: false,
    canSubmit: false
  })
  const [walletLoading, setWalletLoading] = useState(false)

  // Form state
  const [newMeme, setNewMeme] = useState({
    title: '',
    description: '',
    imageUrl: '',
    imagePath: ''
  })
  const [uploadLoading, setUploadLoading] = useState(false)

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Game", href: "/game" },
    { name: "Announcements", href: "/announcements" },
    { name: "Hackathon", href: "/#hackathon" },
    { name: "Tokenomics", href: "/#tokenomics" },
    { name: "How to Buy", href: "/#how-to-buy" },
    { name: "Chart", href: "/#chart" },
    { name: "Memes", href: "/memes" },
    { name: "Community", href: "/#community" },
    { name: "About", href: "/#about" },
  ]

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Set a maximum initialization time
        const initTimeout = setTimeout(() => {
          setLoading(false)
        }, 10000) // 10 second fallback
        
        // Load data in parallel
        await Promise.allSettled([
          loadMemes(),
          loadCurrentContest(),
          // Test Helius RPC connection
          typeof window !== 'undefined' ? testConnection() : Promise.resolve()
        ])
        
        clearTimeout(initTimeout)
      } catch (error) {
        console.error('Error during initialization:', error)
        setLoading(false) // Ensure we exit loading state
        toast({
          title: "Connection Error",
          description: "Please refresh the page to try again.",
          variant: "destructive",
        })
      }
    }
    
    initializeApp()
  }, [])

  useEffect(() => {
    // Prevent hydration errors by only running wallet operations on client
    if (typeof window === 'undefined') return
    
    if (connected && publicKey) {
      loadWalletInfo()
    } else {
      setWalletInfo({
        gudtekBalance: 0,
        solBalance: 0,
        canVote: false,
        canSubmit: false
      })
    }
  }, [connected, publicKey])

  const loadWalletInfo = async () => {
    if (!publicKey) return
    
    setWalletLoading(true)
    try {
      const info = await getWalletInfo(publicKey.toString())
      setWalletInfo(info)
      
      // Update user in database
      await supabase
        .from('users')
        .upsert({
          wallet_address: publicKey.toString(),
          wallet_balance: info.gudtekBalance,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error loading wallet info:', error)
      toast({
        title: "Error",
        description: "Failed to load wallet information",
        variant: "destructive",
      })
    } finally {
      setWalletLoading(false)
    }
  }

  const loadMemes = async () => {
    try {
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      )
      
      const queryPromise = supabase
        .from('memes')
        .select('*')
        .eq('status', 'approved')
        .order('votes_count', { ascending: false })
        .order('created_at', { ascending: false })

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      if (error) {
        throw error
      }
      
      // Load user votes if wallet is connected
      if (connected && publicKey && data?.length > 0) {
        await loadUserVotes(data.map((m: Meme) => m.id))
      }
      
      setMemes(data || [])
    } catch (error) {
      console.error('Error loading memes:', error)
      
      // Set empty array as fallback to prevent infinite loading
      setMemes([])
      
      toast({
        title: "Loading Error",
        description: "Failed to load memes. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUserVotes = async (memeIds: string[]) => {
    if (!publicKey) return

    try {
      const { data } = await supabase
        .from('votes')
        .select('meme_id')
        .eq('voter_wallet', publicKey.toString())
        .in('meme_id', memeIds)

      const votedMemeIds = new Set(data?.map(vote => vote.meme_id) || [])
      setUserVotes(votedMemeIds)
    } catch (error) {
      console.error('Error loading user votes:', error)
    }
  }

  const loadCurrentContest = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_contests')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      setCurrentContest(data || null)
    } catch (error) {
      console.error('Error loading contest:', error)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected")
    }

    setUploadLoading(true)
    try {
      const result = await uploadMemeImage(file, newMeme.title || `meme-${Date.now()}`)
      
      setNewMeme(prev => ({
        ...prev,
        imageUrl: result.publicUrl,
        imagePath: result.filePath
      }))

      toast({
        title: "Image Uploaded!",
        description: "Your meme image has been uploaded successfully",
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
      throw error
    } finally {
      setUploadLoading(false)
    }
  }

  const submitMeme = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to submit memes",
        variant: "destructive",
      })
      return
    }

    if (!walletInfo.canSubmit) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${MIN_GUDTEK_BALANCE * 2} $GUDTEK to submit memes`,
        variant: "destructive",
      })
      return
    }



    if (!newMeme.title?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title for your meme",
        variant: "destructive",
      })
      return
    }

    if (!newMeme.imageUrl || !newMeme.imagePath) {
      toast({
        title: "Missing Information", 
        description: "Please upload an image for your meme",
        variant: "destructive",
      })
      return
    }

    setSubmitLoading(true)
    try {
      // Ensure user exists in database (upsert to avoid conflicts)
      await supabase
        .from('users')
        .upsert({
          wallet_address: publicKey.toString(),
          wallet_balance: walletInfo.gudtekBalance,
          updated_at: new Date().toISOString()
        })

      // Insert the meme
      const { error } = await supabase
        .from('memes')
        .insert({
          title: newMeme.title,
          description: newMeme.description,
          image_url: newMeme.imageUrl,
          image_path: newMeme.imagePath,
          creator_wallet: publicKey.toString(),
          status: 'pending'
        })

      if (error) throw error

      toast({
        title: "Meme Submitted!",
        description: "Your meme has been submitted for review",
      })

      setNewMeme({ title: '', description: '', imageUrl: '', imagePath: '' })
      setIsSubmitOpen(false)
      loadMemes()
    } catch (error) {
      console.error('Error submitting meme:', error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit meme",
        variant: "destructive",
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const voteForMeme = async (memeId: string) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      })
      return
    }

    if (!walletInfo.canVote) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${MIN_GUDTEK_BALANCE} $GUDTEK tokens to vote`,
        variant: "destructive",
      })
      return
    }

    // Check if user already voted
    if (userVotes.has(memeId)) {
      toast({
        title: "Already Voted",
        description: "You have already voted for this meme",
        variant: "destructive",
      })
      return
    }

    setVotingLoading(memeId)
    try {
      // Ensure user exists in database (upsert to avoid conflicts)
      await supabase
        .from('users')
        .upsert({
          wallet_address: publicKey.toString(),
          wallet_balance: walletInfo.gudtekBalance,
          updated_at: new Date().toISOString()
        })

      // Insert the vote
      const { error } = await supabase
        .from('votes')
        .insert({
          meme_id: memeId,
          voter_wallet: publicKey.toString()
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Voted",
            description: "You have already voted for this meme this week",
            variant: "destructive",
          })
        } else {
          throw error
        }
      } else {
        // Update local state immediately
        setUserVotes(prev => new Set(prev).add(memeId))
        setMemes(prev => prev.map(meme => 
          meme.id === memeId 
            ? { ...meme, votes_count: (meme.votes_count || 0) + 1 }
            : meme
        ))

        toast({
          title: "Vote Submitted!",
          description: "Your vote has been recorded",
        })
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast({
        title: "Vote Failed",
        description: "Failed to submit vote",
        variant: "destructive",
      })
    } finally {
      setVotingLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
        {/* Animated Background Grid */}
        <div className="fixed inset-0 opacity-10" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
        </div>
        
        {/* Skeleton Navbar */}
        <nav className="fixed top-0 left-0 right-0 bg-white/10 backdrop-filter backdrop-blur-lg z-50 shadow-lg border-b-2 border-orange-400/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse mr-2" />
                <div className="h-6 w-20 bg-gray-300 rounded animate-pulse" />
              </div>
              <div className="hidden md:flex space-x-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-16 relative z-10">
          {/* Skeleton Hero */}
          <div className="relative min-h-[40vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="relative z-20">
              <div className="mb-4 mt-4">
                <div className="bg-white/20 backdrop-blur-sm border border-gray-300 rounded-xl p-3 shadow-xl max-w-md mx-auto">
                  <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse mx-auto mb-2" />
                  <div className="h-3 w-1/2 bg-gray-300 rounded animate-pulse mx-auto" />
              </div>
          </div>
              
              <div className="h-16 w-80 bg-gray-300 rounded animate-pulse mx-auto mb-4" />
              <div className="h-6 w-96 bg-gray-300 rounded animate-pulse mx-auto mb-8" />
              
              {/* Skeleton Wallet Section */}
              <div className="bg-white/20 backdrop-filter backdrop-blur-lg border-2 border-gray-900/20 rounded-xl p-6 max-w-2xl mx-auto shadow-lg mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2" />
                    <div className="h-8 w-24 bg-gray-300 rounded animate-pulse mb-1" />
                    <div className="h-3 w-20 bg-gray-300 rounded animate-pulse" />
                  </div>
                  <div className="h-12 w-40 bg-gray-300 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Skeleton Contest Card */}
            <div className="mb-8">
              <div className="bg-white/20 backdrop-blur-lg border-2 border-gray-300 rounded-xl p-6 shadow-xl">
                <div className="h-6 w-48 bg-gray-300 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Skeleton Memes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white/20 backdrop-blur-lg border-2 border-gray-300 rounded-xl p-6 shadow-xl">
                  <div className="h-6 w-3/4 bg-gray-300 rounded animate-pulse mb-4" />
                  <div className="aspect-square bg-gray-300 rounded-lg animate-pulse mb-4" />
                  <div className="flex justify-between mb-4">
                    <div className="h-3 w-20 bg-gray-300 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-300 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-gray-300 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading indicator with progress feel */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-300">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-800 font-medium">Loading memes...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Navbar - Matching main site */}
      <nav className="fixed top-0 left-0 right-0 bg-white/10 backdrop-filter backdrop-blur-lg z-50 shadow-lg border-b-2 border-orange-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Logo/Site Title */}
              <Link href="/" className="flex-shrink-0 flex items-center">
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
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      item.name === 'Memes' 
                        ? 'bg-gray-900/20 text-gray-900 font-bold' 
                        : 'text-gray-800 hover:text-gray-900'
                    }`}
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
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  item.name === 'Memes' 
                    ? 'bg-gray-900/20 text-gray-900 font-bold' 
                    : 'text-gray-800 hover:text-gray-900'
                }`}
                onClick={() => setIsNavOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16 relative z-10">
        {/* Hero Header */}
        <div className="relative min-h-[40vh] flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-20"
          >
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="mb-4 mt-4"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 border-2 border-yellow-400 rounded-xl p-3 shadow-xl max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-800" />
                  </div>
                  <span className="text-sm font-black text-yellow-300">COMMUNITY MEME GALLERY</span>
                </div>
                <p className="text-xs font-medium text-blue-100 text-center">
                  Share your creativity • Vote for favorites • Win $GUDTEK rewards
                </p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-5xl md:text-7xl font-black text-gray-900 mb-4 tracking-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              GUD MEMES
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-xl md:text-2xl font-bold text-gray-800 mb-8 max-w-2xl mx-auto"
            >
              Community-driven meme competitions with $GUDTEK rewards
            </motion.p>

            {/* Wallet Connection Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mb-8"
            >
              <div className="bg-white/20 backdrop-filter backdrop-blur-lg border-2 border-gray-900/20 rounded-xl p-6 max-w-2xl mx-auto shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    {connected && publicKey ? (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-1">Your $GUDTEK Balance</p>
                        <p className="text-2xl font-black text-gray-900">
                          {walletLoading ? 'Loading...' : formatTokenBalance(walletInfo.gudtekBalance)}
                        </p>
                        <p className="text-sm text-gray-600">
                          SOL: {walletLoading ? '...' : formatSolBalance(walletInfo.solBalance)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-gray-900 mb-1">Connect Your Wallet</p>
                        <p className="text-sm text-gray-700">To participate in meme contests</p>
                      </div>
                    )}
                  </div>
                  <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 !border-2 !border-gray-900 !rounded-lg !font-bold !shadow-lg transform hover:scale-105 transition-all duration-200" />
                </div>
              </div>
            </motion.div>

            {/* Wallet Status Alert */}
            {connected && publicKey && !walletLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="mb-8 max-w-2xl mx-auto"
              >
                {walletInfo.canSubmit ? (
                  <Alert className="border-2 border-green-400 bg-green-100/80 backdrop-filter backdrop-blur-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800 font-bold">
                      🎉 Perfect! You can submit memes and vote in contests!
                    </AlertDescription>
                  </Alert>
                ) : walletInfo.canVote ? (
                  <Alert className="border-2 border-yellow-400 bg-yellow-100/80 backdrop-filter backdrop-blur-sm">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 font-bold">
                      👍 You can vote! Need {MIN_GUDTEK_BALANCE * 2} $GUDTEK to submit memes.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-2 border-red-400 bg-red-100/80 backdrop-filter backdrop-blur-sm">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800 font-bold">
                      ❌ Need at least {MIN_GUDTEK_BALANCE} $GUDTEK tokens to participate.
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Contest Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentContest && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-4 border-yellow-400 shadow-2xl text-white overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:20px_20px] animate-pulse" />
                </div>
                
                <CardHeader className="relative z-10 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-400 p-3 rounded-full border-2 border-white shadow-lg">
                        <Trophy className="w-6 h-6 text-purple-800" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black text-yellow-300">
                          WEEKLY CONTEST ACTIVE!
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-sm text-green-300 font-bold">Live Now</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-yellow-300">Win</div>
                      <div className="text-2xl font-black text-white">$GUDTEK</div>
                    </div>
                  </div>
                  <CardDescription className="text-blue-100 font-medium text-base mt-3">
                    Submit your best memes and compete for weekly prizes! 
                    <span className="text-yellow-300 font-bold"> Community votes decide the winner.</span>
                    <br />
                    <span className="text-green-300 font-bold">🎁 Bonus: Active voters also have a chance to win $GUDTEK rewards!</span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="grid md:grid-cols-3 gap-4 text-sm font-medium">
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-yellow-300" />
                        <span className="text-yellow-300 font-bold">Contest Ends</span>
                      </div>
                      <div className="text-white font-bold">
                        {new Date(currentContest.week_end).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-yellow-300" />
                        <span className="text-yellow-300 font-bold">Submissions</span>
                      </div>
                      <div className="text-white font-bold text-lg">
                        {memes.length} memes
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-300" />
                        <span className="text-yellow-300 font-bold">Rewards</span>
                      </div>
                      <div className="text-white font-bold text-sm">
                        Creators & Voters Win
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4"
          >
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Community Memes</h2>
              <p className="text-lg font-bold text-gray-800">Vote for your favorites and help decide the weekly winner</p>
            </div>
            
            <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 border-2 border-gray-900 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-200 text-lg px-6 py-3"
                  disabled={!connected || !walletInfo.canSubmit}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Submit Meme
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white/95 backdrop-filter backdrop-blur-lg border-2 border-gray-900">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-gray-900">Submit Your Meme</DialogTitle>
                  <DialogDescription className="text-gray-700 font-bold">
                    Share your meme with the community and compete for weekly prizes!
                    <br />
                    <span className="text-orange-600 font-black">
                      Requires {MIN_GUDTEK_BALANCE * 2} $GUDTEK tokens
                    </span>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="font-bold text-gray-900">Title</Label>
                    <Input
                      id="title"
                      value={newMeme.title}
                      onChange={(e) => setNewMeme(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Give your meme a catchy title"
                      className="border-2 border-gray-300 font-bold text-gray-900 bg-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="font-bold text-gray-900">Upload Meme Image</Label>
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      loading={uploadLoading}
                      maxFileSize={10 * 1024 * 1024} // 10MB
                      disabled={!connected || !walletInfo.canSubmit}
                    />
                    {newMeme.imageUrl && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 font-medium">✅ Image uploaded successfully!</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="font-bold text-gray-900">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newMeme.description}
                      onChange={(e) => setNewMeme(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell us about your meme..."
                      rows={3}
                      className="border-2 border-gray-300 font-bold text-gray-900 bg-white"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSubmitOpen(false)}
                    className="border-2 border-gray-900 font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={submitMeme} 
                    disabled={
                      submitLoading || 
                      !connected || 
                      !walletInfo.canSubmit || 
                      !newMeme.title?.trim() || 
                      !newMeme.imageUrl ||
                      uploadLoading
                    }
                    className="bg-orange-500 hover:bg-orange-600 border-2 border-gray-900 font-bold disabled:opacity-50"
                  >
                    {submitLoading ? '⏳ Submitting...' : 
                     uploadLoading ? '📤 Uploading...' :
                     !newMeme.title?.trim() ? '📝 Add Title' :
                     !newMeme.imageUrl ? '📷 Upload Image' :
                     '🚀 Submit Meme'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Memes Grid */}
          {memes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card className="text-center py-16 bg-white/20 backdrop-filter backdrop-blur-lg border-4 border-gray-900 shadow-2xl">
                <CardContent>
                  <Trophy className="w-24 h-24 mx-auto text-gray-600 mb-6" />
                  <h3 className="text-3xl font-black text-gray-900 mb-4">No memes yet!</h3>
                  <p className="text-xl font-bold text-gray-800 mb-6">Be the first to submit a meme and start the fun</p>
                  <Button 
                    onClick={() => setIsSubmitOpen(true)} 
                    className="bg-orange-500 hover:bg-orange-600 border-2 border-gray-900 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-200 text-lg px-8 py-4"
                    disabled={!connected || !walletInfo.canSubmit}
                  >
                    🎯 Submit First Meme
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {memes.map((meme, index) => (
                <motion.div
                  key={meme.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-2xl transition-all duration-300 bg-white/20 backdrop-filter backdrop-blur-lg border-4 border-gray-900/20 hover:border-gray-900 transform hover:scale-105">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-black text-gray-900">{meme.title}</CardTitle>
                      {meme.description && (
                        <CardDescription className="font-bold text-gray-700">{meme.description}</CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4 border-2 border-gray-900">
                        <img
                          src={meme.image_url}
                          alt={meme.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-meme.jpg'
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm font-bold text-gray-700">
                        <span>By: {meme.creator_wallet.slice(0, 8)}...</span>
                        <span>{new Date(meme.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button
                        variant="outline"
                        className={`w-full border-2 font-bold transition-all duration-200 transform hover:scale-105 ${
                          userVotes.has(meme.id) 
                            ? 'bg-red-100 border-red-400 text-red-600 hover:bg-red-200' 
                            : 'hover:bg-red-100 hover:border-red-400 hover:text-red-600 border-gray-900'
                        }`}
                        onClick={() => voteForMeme(meme.id)}
                        disabled={!connected || !walletInfo.canVote || votingLoading === meme.id || userVotes.has(meme.id)}
                      >
                        <Heart className={`w-5 h-5 mr-2 ${userVotes.has(meme.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        {votingLoading === meme.id 
                          ? '⏳ Voting...' 
                          : userVotes.has(meme.id)
                            ? `✅ Voted (${meme.votes_count})`
                            : `Vote (${meme.votes_count})`
                        }
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Feedback Button */}
      <motion.button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white p-4 rounded-full shadow-2xl z-40 transition-all duration-300 hover:scale-110"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        aria-label="Open feedback form"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Feedback Form Modal */}
      <FeedbackForm isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  )
} 