"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MessageSquare, Megaphone, Image, BarChart3, Users, Settings, Bell, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalFeedback: 0,
    newFeedback: 0,
    activeAnnouncements: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch feedback stats
        const feedbackResponse = await fetch('/api/feedback', {
          headers: { 'Authorization': 'Bearer admin-token' }
        })
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json()
          
          // Fetch announcements stats
          const announcementsResponse = await fetch('/api/announcements')
          if (announcementsResponse.ok) {
            const announcementsData = await announcementsResponse.json()
            
            setStats({
              totalFeedback: feedbackData.total || 0,
              newFeedback: feedbackData.newCount || 0,
              activeAnnouncements: announcementsData.announcements?.length || 0
            })
          }
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const adminCards = [
    {
      title: "User Feedback",
      description: "View and respond to community feedback",
      icon: MessageSquare,
      href: "/admin/feedback",
      color: "from-blue-500 to-blue-600",
      stats: `${stats.totalFeedback} total, ${stats.newFeedback} new`,
      badge: stats.newFeedback > 0 ? stats.newFeedback : null
    },
    {
      title: "Announcements",
      description: "Manage site-wide announcements",
      icon: Megaphone,
      href: "/admin/announcements",
      color: "from-orange-500 to-yellow-500",
      stats: `${stats.activeAnnouncements} active`,
      badge: null
    },
    {
      title: "Meme Management",
      description: "Upload and manage community memes",
      icon: Image,
      href: "/admin/memes",
      color: "from-purple-500 to-pink-500",
      stats: "Browse gallery",
      badge: null
    },
    {
      title: "Analytics",
      description: "View site analytics and performance",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "from-green-500 to-emerald-600",
      stats: "Coming soon",
      badge: null,
      disabled: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Welcome to the Gud Tek admin panel. Manage your community and announcements.
            </p>
          </div>

          {/* Quick Stats */}
          {!isLoading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white text-center">
                <div className="text-2xl font-bold">{stats.totalFeedback}</div>
                <div className="text-sm opacity-90">Total Feedback</div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl p-4 text-white text-center">
                <div className="text-2xl font-bold">{stats.newFeedback}</div>
                <div className="text-sm opacity-90">New Messages</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white text-center">
                <div className="text-2xl font-bold">{stats.activeAnnouncements}</div>
                <div className="text-sm opacity-90">Active Announcements</div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${card.disabled ? 'opacity-60' : ''}`}
            >
              <Link
                href={card.disabled ? '#' : card.href}
                className={`block ${card.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                  {/* Card Header */}
                  <div className={`bg-gradient-to-r ${card.color} p-6 text-white relative`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/20 rounded-full">
                          <card.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{card.title}</h3>
                          <p className="text-sm opacity-90">{card.description}</p>
                        </div>
                      </div>
                      {card.badge && (
                        <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {card.badge}
                        </div>
                      )}
                    </div>
                    
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10" aria-hidden="true">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,#000_1px,transparent_1px),linear-gradient(-45deg,#000_1px,transparent_1px)] bg-[size:20px_20px]" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">{card.stats}</p>
                      </div>
                      <Button 
                        className={`${
                          card.disabled 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : `bg-gradient-to-r ${card.color} hover:shadow-lg transform hover:scale-105`
                        } text-white transition-all duration-200`}
                        disabled={card.disabled}
                      >
                        {card.disabled ? 'Coming Soon' : 'Manage'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 mt-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/announcements">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white">
                <Megaphone className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </Link>
            
            <Link href="/admin/feedback">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Feedback
              </Button>
            </Link>
            
            <Link href="/admin/memes">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <Image className="w-4 h-4 mr-2" />
                Upload Meme
              </Button>
            </Link>
            
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white">
                <FileText className="w-4 h-4 mr-2" />
                View Site
              </Button>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Admin Notes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check feedback regularly to maintain community engagement</li>
              <li>• Use announcements to communicate important updates</li>
              <li>• Monitor meme submissions for quality and appropriateness</li>
              <li>• Authentication is currently simplified - implement proper auth for production</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 