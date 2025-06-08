"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MessageSquare, User, Mail, Clock, Eye, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Feedback {
  id: string
  name: string
  email: string
  subject: string
  message: string
  timestamp: string
  status: 'new' | 'read' | 'responded'
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, newCount: 0 })

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/feedback', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback || [])
        setStats({ total: data.total, newCount: data.newCount })
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-green-600 bg-green-100 border-green-200'
      case 'read':
        return 'text-blue-600 bg-blue-100 border-blue-200'
      case 'responded':
        return 'text-purple-600 bg-purple-100 border-purple-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin"
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Feedback</h1>
                <p className="text-gray-600">View and manage feedback from your community</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Feedback</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">{stats.newCount}</div>
                <div className="text-sm text-gray-600">New Messages</div>
              </div>
              <Button
                onClick={fetchFeedback}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feedback List */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">All Feedback</h2>
              <p className="text-sm text-gray-600">Click on any message to view details</p>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-orange-400/30 border-t-orange-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading feedback...</p>
              </div>
            ) : feedback.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No feedback received yet.</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {feedback.map((item) => {
                  const { date, time } = formatDate(item.timestamp)
                  return (
                    <motion.div
                      key={item.id}
                      onClick={() => setSelectedFeedback(item)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedFeedback?.id === item.id ? 'bg-orange-50 border-orange-200' : ''
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-orange-100 rounded-full">
                            <User className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                            {item.status.toUpperCase()}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {date} at {time}
                          </div>
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{item.subject}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.message}</p>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Feedback Detail */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Feedback Details</h2>
              <p className="text-sm text-gray-600">
                {selectedFeedback ? 'View and respond to feedback' : 'Select a message to view details'}
              </p>
            </div>

            {selectedFeedback ? (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedFeedback.subject}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedFeedback.status)}`}>
                        {selectedFeedback.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(selectedFeedback.timestamp).date}</span>
                    </div>
                    <div>{formatDate(selectedFeedback.timestamp).time}</div>
                  </div>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900">{selectedFeedback.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <a 
                        href={`mailto:${selectedFeedback.email}?subject=Re: ${selectedFeedback.subject}`}
                        className="text-orange-600 hover:text-orange-700 underline"
                      >
                        {selectedFeedback.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Message</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {selectedFeedback.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={() => window.open(`mailto:${selectedFeedback.email}?subject=Re: ${selectedFeedback.subject}&body=Hi ${selectedFeedback.name},%0D%0A%0D%0AThank you for your feedback regarding "${selectedFeedback.subject}".%0D%0A%0D%0A`)}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Reply via Email
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Clicking "Reply via Email" will open your default email client with a pre-filled response.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a feedback message from the list to view details and respond.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 