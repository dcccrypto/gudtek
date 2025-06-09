"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, User, ArrowLeft, RefreshCw, Clock, Reply, Mail, AlertCircle, Check, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { 
  markFeedbackAsRead, 
  addAdminResponse, 
  deleteFeedback, 
  type Feedback 
} from "@/lib/supabase"

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, newCount: 0 })
  const [adminResponse, setAdminResponse] = useState('')
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedback = async () => {
    try {
      setError(null)
      const response = await fetch('/api/feedback')
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback || [])
        setStats({ total: data.total || 0, newCount: data.newCount || 0 })
      } else {
        setError('Failed to fetch feedback. Please try again.')
        console.error('Failed to fetch feedback:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
      setError('Connection error. Please check your internet connection.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [])

  const handleMarkAsRead = async (feedbackItem: Feedback) => {
    if (feedbackItem.is_read) return

    try {
      await markFeedbackAsRead(feedbackItem.id)
      await fetchFeedback() // Refresh the list
    } catch (error) {
      console.error('Error marking feedback as read:', error)
    }
  }

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !adminResponse.trim()) return

    setIsSubmittingResponse(true)
    try {
      await addAdminResponse(selectedFeedback.id, adminResponse.trim())
      setAdminResponse('')
      await fetchFeedback() // Refresh the list
      
      // Update selected feedback
      setSelectedFeedback(prev => prev ? {
        ...prev,
        admin_response: adminResponse.trim(),
        is_read: true
      } : null)
      
      alert('Response added successfully!')
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('Failed to submit response. Please try again.')
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    try {
      await deleteFeedback(id)
      await fetchFeedback() // Refresh the list
      
      // Clear selection if deleted item was selected
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null)
      }
      
      alert('Feedback deleted successfully!')
    } catch (error) {
      console.error('Error deleting feedback:', error)
      alert('Failed to delete feedback. Please try again.')
    }
  }

  const getStatusColor = (isRead: boolean, hasResponse: boolean) => {
    if (hasResponse) {
      return 'text-purple-600 bg-purple-100 border-purple-200'
    } else if (isRead) {
      return 'text-blue-600 bg-blue-100 border-blue-200'
    } else {
      return 'text-green-600 bg-green-100 border-green-200'
    }
  }

  const getStatusText = (isRead: boolean, hasResponse: boolean) => {
    if (hasResponse) return 'RESPONDED'
    if (isRead) return 'READ'
    return 'NEW'
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

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

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
                  const { date, time } = formatDate(item.created_at)
                  return (
                    <motion.div
                      key={item.id}
                      onClick={() => {
                        setSelectedFeedback(item)
                        handleMarkAsRead(item)
                      }}
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
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.is_read, !!item.admin_response)}`}>
                            {getStatusText(item.is_read, !!item.admin_response)}
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedFeedback.is_read, !!selectedFeedback.admin_response)}`}>
                        {getStatusText(selectedFeedback.is_read, !!selectedFeedback.admin_response)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</label>
                      <p className="text-sm font-medium text-gray-900">{selectedFeedback.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                      <p className="text-sm font-medium text-gray-900">{selectedFeedback.email}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</label>
                    <div className="flex items-center space-x-1 text-sm text-gray-900">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(selectedFeedback.created_at).date} at {formatDate(selectedFeedback.created_at).time}</span>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Message</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedFeedback.message}</p>
                  </div>
                </div>

                {/* Existing Admin Response */}
                {selectedFeedback.admin_response && (
                  <div className="mb-6">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Your Response</label>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedFeedback.admin_response}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Response Form */}
                <div className="space-y-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedFeedback.admin_response ? 'Update Response' : 'Add Response'}
                  </label>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Type your response here..."
                    className="min-h-[120px]"
                  />
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={!adminResponse.trim() || isSubmittingResponse}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                  >
                    {isSubmittingResponse ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Reply className="w-4 h-4 mr-2" />
                        {selectedFeedback.admin_response ? 'Update Response' : 'Send Response'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a feedback message to view details and respond.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 