import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get all pending memes for review
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('memes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching memes:', error)
    return NextResponse.json({ error: 'Failed to fetch memes' }, { status: 500 })
  }
}

// Update meme status (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { memeId, status } = body

    if (!memeId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const { error } = await supabase
      .from('memes')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', memeId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating meme:', error)
    return NextResponse.json({ error: 'Failed to update meme' }, { status: 500 })
  }
} 