import { NextRequest, NextResponse } from 'next/server'
import { addFeedback, getAllFeedback, getFeedbackStats } from '@/lib/storage'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const feedback = addFeedback({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim()
    })

    return NextResponse.json(
      { message: 'Feedback submitted successfully!', id: feedback.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simple admin check (you should implement proper authentication)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== 'Bearer admin-token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all feedback sorted by timestamp (newest first)
    const sortedFeedback = getAllFeedback()
    const stats = getFeedbackStats()

    return NextResponse.json({
      feedback: sortedFeedback,
      total: stats.total,
      unread: stats.unread,
      recent: stats.recent
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
} 