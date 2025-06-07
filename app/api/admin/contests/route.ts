import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Create new weekly contest
export async function POST() {
  try {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // End of current week (Saturday)
    
    const { data, error } = await supabase
      .from('weekly_contests')
      .insert({
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        prize_amount: 'TBD', // Prize amount to be determined by community voting
        status: 'active'
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error creating contest:', error)
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 })
  }
}

// End current contest and pick winner
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { contestId, winnerMemeId, winnerWallet } = body

    if (!contestId || !winnerMemeId || !winnerWallet) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const { error } = await supabase
      .from('weekly_contests')
      .update({
        winner_meme_id: winnerMemeId,
        winner_wallet: winnerWallet,
        status: 'completed'
      })
      .eq('id', contestId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending contest:', error)
    return NextResponse.json({ error: 'Failed to end contest' }, { status: 500 })
  }
} 