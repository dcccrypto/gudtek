import { NextRequest, NextResponse } from 'next/server'
import { getGameSettings, updateGameSetting } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const settings = await getGameSettings()
    
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching game settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    const updatedSetting = await updateGameSetting(key, value, 'admin')
    
    return NextResponse.json({ 
      success: true, 
      setting: updatedSetting 
    })
  } catch (error) {
    console.error('Error updating game setting:', error)
    return NextResponse.json(
      { error: 'Failed to update game setting' },
      { status: 500 }
    )
  }
} 