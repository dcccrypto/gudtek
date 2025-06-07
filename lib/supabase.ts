import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name for meme uploads
export const MEMES_BUCKET = 'memes'

// File upload utilities
export const uploadMemeImage = async (file: File, fileName: string) => {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${timestamp}-${fileName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${fileExtension}`
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(MEMES_BUCKET)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(MEMES_BUCKET)
      .getPublicUrl(uniqueFileName)

    return {
      filePath: data.path,
      publicUrl: publicUrl
    }
  } catch (error) {
    console.error('Error uploading meme image:', error)
    throw error
  }
}

// Delete meme image (for admin use)
export const deleteMemeImage = async (filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from(MEMES_BUCKET)
      .remove([filePath])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting meme image:', error)
    throw error
  }
}

// Database types
export interface User {
  id: string
  wallet_address: string
  wallet_balance: number
  created_at: string
  updated_at: string
}

export interface Meme {
  id: string
  title: string
  description?: string
  image_url: string
  image_path?: string // Store the storage path for deletion
  creator_wallet: string
  status: 'pending' | 'approved' | 'rejected'
  votes_count: number
  created_at: string
}

export interface Vote {
  id: string
  meme_id: string
  voter_wallet: string
  created_at: string
}

export interface WeeklyContest {
  id: string
  week_start: string
  week_end: string
  prize_amount: string | number
  status: 'active' | 'completed'
  winner_meme_id?: string
  winner_wallet?: string
  created_at: string
} 