import { NextRequest, NextResponse } from 'next/server'
import { 
  createFeedback, 
  getAllFeedback, 
  getFeedbackStats 
} from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await createFeedback({ name, email, subject, message })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FEEDBACK_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    const feedback = await getAllFeedback()
    const stats = await getFeedbackStats()

    return NextResponse.json({
      feedback: feedback,
      total: stats.total,
      newCount: stats.unread,
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