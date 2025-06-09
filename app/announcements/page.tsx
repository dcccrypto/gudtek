"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, AlertCircle, Info, CheckCircle, Megaphone, Home, Menu, X, Filter, Search, Share2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import FeedbackForm from '@/components/FeedbackForm'

interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'announcement'
  priority: number
  is_active: boolean
  expires_at?: string
  image_url?: string
  image_path?: string
  created_at: string
  updated_at: string
}

const typeConfig = {
  info: {
    icon: Info,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50/80',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900'
  },
  warning: {
    icon: AlertCircle,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50/80',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-900'
  },
  success: {
    icon: CheckCircle,
    color: 'bg-green-500',
    bgColor: 'bg-green-50/80',
    borderColor: 'border-green-200',
    textColor: 'text-green-900'
  },
  announcement: {
    icon: Megaphone,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50/80',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-900'
  }
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  // Navigation items matching main site
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
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements')
        if (!response.ok) {
          throw new Error('Failed to fetch announcements')
        }
        const data = await response.json()
        setAnnouncements(data.announcements || [])
        setFilteredAnnouncements(data.announcements || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  useEffect(() => {
    let filtered = announcements

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        announcement =>
          announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          announcement.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(announcement => announcement.type === filterType)
    }

    setFilteredAnnouncements(filtered)
  }, [searchTerm, filterType, announcements])

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const shareAnnouncement = async (announcement: Announcement) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Gud Tek - ${announcement.title}`,
          text: announcement.message,
          url: window.location.href
        })
      } catch (err) {
        // Fallback to clipboard
        copyToClipboard(announcement)
      }
    } else {
      copyToClipboard(announcement)
    }
  }

  const copyToClipboard = (announcement: Announcement) => {
    const text = `${announcement.title}\n\n${announcement.message}\n\n${window.location.href}`
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
        {/* Animated Background Grid */}
        <div className="fixed inset-0 opacity-10" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
        </div>

        {/* Navbar - matching main site */}
        <nav className="fixed left-0 right-0 top-0 bg-white/10 backdrop-filter backdrop-blur-lg z-50 shadow-lg border-b-2 border-orange-400/30">
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
                        item.name === 'Announcements' 
                          ? 'text-gray-900 bg-white/20' 
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
                    item.name === 'Announcements' 
                      ? 'text-gray-900 bg-white/20' 
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

        <div className="flex items-center justify-center min-h-screen pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-900 border-t-transparent mx-auto mb-6"></div>
            <p className="text-xl font-bold text-gray-900">Loading announcements...</p>
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

      {/* Navbar - matching main site */}
      <nav className="fixed left-0 right-0 top-0 bg-white/10 backdrop-filter backdrop-blur-lg z-50 shadow-lg border-b-2 border-orange-400/30">
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
                      item.name === 'Announcements' 
                        ? 'text-gray-900 bg-white/20' 
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
                  item.name === 'Announcements' 
                    ? 'text-gray-900 bg-white/20' 
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
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border-2 border-gray-900/20 rounded-full px-6 py-3 mb-6 shadow-xl">
              <Megaphone className="w-6 h-6 text-gray-900" />
              <span className="text-lg font-black text-gray-900">OFFICIAL ANNOUNCEMENTS</span>
          </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
              Stay Updated
            </h1>
            <p className="text-xl font-bold text-gray-800 max-w-2xl mx-auto">
              Get the latest news and updates from the Gud Tek team
          </p>
        </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 w-5 h-5" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white/20 backdrop-blur-sm border-2 border-gray-900/20 text-gray-900 placeholder:text-gray-700 font-medium focus:border-gray-900/40"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-12 bg-white/20 backdrop-blur-sm border-2 border-gray-900/20 text-gray-900 font-medium focus:border-gray-900/40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="announcement">📢 Announcements</SelectItem>
                  <SelectItem value="info">ℹ️ Info</SelectItem>
                  <SelectItem value="warning">⚠️ Warnings</SelectItem>
                  <SelectItem value="success">✅ Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-white/20 backdrop-blur-sm border-2 border-gray-900/20 rounded-xl p-4 shadow-xl">
              <p className="text-center text-gray-900 font-bold">
                Showing <span className="text-lg font-black">{filteredAnnouncements.length}</span> of <span className="text-lg font-black">{announcements.length}</span> announcements
                {(searchTerm || filterType !== 'all') && (
                  <span className="ml-2 text-sm">• Filtered results</span>
                )}
              </p>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Card className="border-2 border-red-300 bg-red-50/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-6 h-6 text-red-600 mr-4" />
                    <div>
                      <h3 className="font-bold text-red-800 text-lg">Error Loading Announcements</h3>
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Announcements Grid */}
          {filteredAnnouncements.length === 0 && !error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="text-center py-16 bg-white/20 backdrop-blur-sm border-2 border-gray-900/20 shadow-xl">
                <CardContent>
                  <Megaphone className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchTerm || filterType !== 'all' ? 'No announcements found' : 'No announcements yet'}
                  </h3>
                  <p className="text-gray-800 text-lg font-medium">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'Check back later for updates from the Gud Tek team!'}
            </p>
                </CardContent>
              </Card>
          </motion.div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements.map((announcement, index) => {
              const config = typeConfig[announcement.type]
              const Icon = config.icon
                const isPriority = announcement.priority <= 3

              return (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className={`h-full ${config.bgColor} backdrop-blur-sm ${config.borderColor} border-2 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${isPriority ? 'ring-2 ring-orange-400 shadow-xl' : 'shadow-lg'}`}>
                      {announcement.image_url && (
                        <div className="relative h-48 w-full">
                          <Image
                            src={announcement.image_url}
                            alt={announcement.title}
                            fill
                            className="object-cover rounded-t-lg"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-full ${config.color} shadow-lg`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <Badge variant="secondary" className="text-xs capitalize font-bold bg-gray-900 text-white">
                              {announcement.type}
                            </Badge>
                            {isPriority && (
                              <Badge className="text-xs bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold">
                                High Priority
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shareAnnouncement(announcement)}
                            className="h-8 w-8 p-0 hover:bg-gray-900/10"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <CardTitle className={`text-lg leading-tight font-black ${config.textColor}`}>
                          {announcement.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <p className={`text-sm ${config.textColor} mb-6 line-clamp-3 font-medium`}>
                          {announcement.message}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-700">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span className="font-medium">{formatDate(announcement.created_at)}</span>
                          </div>
                          {announcement.expires_at && (
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              <span className="font-medium">Expires {formatDate(announcement.expires_at)}</span>
                          </div>
                        )}
                      </div>
                      </CardContent>
                    </Card>
                </motion.div>
              )
            })}
          </div>
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