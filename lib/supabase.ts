import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket names
export const MEMES_BUCKET = 'memes'
export const ANNOUNCEMENTS_BUCKET = 'announcement'

// File upload utilities for memes
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

// File upload utilities for announcements
export const uploadAnnouncementImage = async (file: File, fileName: string) => {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${timestamp}-${fileName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${fileExtension}`
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(ANNOUNCEMENTS_BUCKET)
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
      .from(ANNOUNCEMENTS_BUCKET)
      .getPublicUrl(uniqueFileName)

    return {
      filePath: data.path,
      publicUrl: publicUrl
    }
  } catch (error) {
    console.error('Error uploading announcement image:', error)
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

// Delete announcement image (for admin use)
export const deleteAnnouncementImage = async (filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from(ANNOUNCEMENTS_BUCKET)
      .remove([filePath])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting announcement image:', error)
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
  created_at: string
}

export interface Announcement {
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

// Game-related interfaces
export interface GameUser {
  id: string
  wallet_address: string
  token_balance: number
  is_verified: boolean
  is_banned: boolean
  username?: string
  last_balance_check: string
  created_at: string
  updated_at: string
}

export interface GameSession {
  id: string
  user_id: string
  wallet_address: string
  score: number
  duration_ms: number
  tokens_collected: number
  obstacles_hit: number
  session_hash: string
  ip_address?: string
  user_agent?: string
  is_valid: boolean
  created_at: string
}

export interface GameLeaderboard {
  id: string
  user_id: string
  wallet_address: string
  username?: string
  high_score: number
  total_score: number
  total_games: number
  total_tokens_collected: number
  rank_position?: number
  created_at: string
  updated_at: string
}

export interface GameAchievement {
  id: string
  user_id: string
  achievement_type: string
  achievement_data: any
  created_at: string
}

export interface GameSettings {
  id: string
  setting_key: string
  setting_value: string
  description?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

// Announcement database functions
export const getActiveAnnouncements = async () => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching active announcements:', error)
    throw error
  }
}

export const getAllAnnouncements = async () => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all announcements:', error)
    throw error
  }
}

export const createAnnouncement = async (announcement: {
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'announcement'
  priority: number
  expires_at?: string
  image_url?: string
  image_path?: string
}) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcement])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating announcement:', error)
    throw error
  }
}

export const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating announcement:', error)
    throw error
  }
}

export const deleteAnnouncement = async (id: string) => {
  try {
    // First get the announcement to delete associated image
    const { data: announcement } = await supabase
      .from('announcements')
      .select('image_path')
      .eq('id', id)
      .single()

    // Delete the announcement
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Delete associated image if exists
    if (announcement?.image_path) {
      await deleteAnnouncementImage(announcement.image_path)
    }

    return true
  } catch (error) {
    console.error('Error deleting announcement:', error)
    throw error
  }
}

// ============ GAME DATABASE FUNCTIONS ============

// Game settings functions
export const getGameSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('game_settings')
      .select('*')
      .order('setting_key')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching game settings:', error)
    throw error
  }
}

export const getGameSetting = async (key: string) => {
  try {
    const { data, error } = await supabase
      .from('game_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single()

    if (error) throw error
    return data?.setting_value
  } catch (error) {
    console.error('Error fetching game setting:', error)
    return null
  }
}

export const updateGameSetting = async (key: string, value: string, updatedBy?: string) => {
  try {
    const { data, error } = await supabase
      .from('game_settings')
      .update({ 
        setting_value: value, 
        updated_by: updatedBy,
        updated_at: new Date().toISOString() 
      })
      .eq('setting_key', key)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating game setting:', error)
    throw error
  }
}

// Game user functions
export const getOrCreateGameUser = async (walletAddress: string, tokenBalance: number = 0) => {
  try {
    // First try to get existing user
    let { data: user, error } = await supabase
      .from('game_users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create new one
      const { data: newUser, error: createError } = await supabase
        .from('game_users')
        .insert([{
          wallet_address: walletAddress,
          token_balance: tokenBalance,
          is_verified: tokenBalance >= parseFloat(await getGameSetting('min_token_balance') || '10000'),
          last_balance_check: new Date().toISOString()
        }])
        .select()
        .single()

      if (createError) throw createError
      
      // Create leaderboard entry for new user
      try {
        await supabase
          .from('game_leaderboard')
          .insert([{
            user_id: newUser.id,
            wallet_address: walletAddress,
            username: newUser.username,
            high_score: 0,
            total_games: 0,
            total_tokens_collected: 0
          }])
      } catch (leaderboardError) {
        // Don't fail user creation if leaderboard entry fails
        console.warn('Failed to create leaderboard entry:', leaderboardError)
      }

      user = newUser
    } else if (error) {
      throw error
    }

    return user
  } catch (error) {
    console.error('Error getting/creating game user:', error)
    throw error
  }
}

export const updateUserTokenBalance = async (walletAddress: string, balance: number) => {
  try {
    const minBalance = parseFloat(await getGameSetting('min_token_balance') || '10000')
    
    const { data, error } = await supabase
      .from('game_users')
      .update({
        token_balance: balance,
        is_verified: balance >= minBalance,
        last_balance_check: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user token balance:', error)
    throw error
  }
}

export const updateUserUsername = async (walletAddress: string, username: string) => {
  try {
    const { data, error } = await supabase
      .from('game_users')
      .update({ username })
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (error) throw error

    // Also update in leaderboard
    await supabase
      .from('game_leaderboard')
      .update({ username })
      .eq('wallet_address', walletAddress)

    return data
  } catch (error) {
    console.error('Error updating username:', error)
    throw error
  }
}

// Enhanced game session functions with automatic user creation
export const createGameSession = async (sessionData: {
  walletAddress: string
  score: number
  durationMs: number
  tokensCollected: number
  obstaclesHit: number
  sessionHash: string
  ipAddress?: string
  userAgent?: string
}) => {
  try {
    console.log('Creating game session for wallet:', sessionData.walletAddress)
    
    // First, ensure user exists or create them
    let user = await getOrCreateGameUser(sessionData.walletAddress)
    
    if (!user) {
      throw new Error('Failed to get or create user')
    }

    console.log('User resolved:', user.id)

    // Validate session data for anti-cheat
    const maxScore = parseInt(await getGameSetting('max_score_per_session') || '100000')
    const isValid = sessionData.score <= maxScore && 
                   sessionData.durationMs >= 5000 && // Minimum 5 seconds
                   sessionData.tokensCollected >= 0 &&
                   sessionData.obstaclesHit >= 0 &&
                   sessionData.tokensCollected <= sessionData.score // Sanity check

    console.log('Session validation:', { isValid, maxScore, actualScore: sessionData.score })

    // Create game session with proper field mapping
    const sessionInsert = {
      user_id: user.id,
      wallet_address: sessionData.walletAddress,
      score: sessionData.score,
      duration_ms: sessionData.durationMs,
      tokens_collected: sessionData.tokensCollected,
      obstacles_hit: sessionData.obstaclesHit,
      session_hash: sessionData.sessionHash,
      ip_address: sessionData.ipAddress || null,
      user_agent: sessionData.userAgent || null,
      is_valid: isValid
    }

    console.log('Inserting game session:', sessionInsert)

    const { data, error } = await supabase
      .from('game_sessions')
      .insert([sessionInsert])
      .select()
      .single()

    if (error) {
      console.error('Error creating game session:', error)
      throw error
    }

    console.log('Game session created successfully:', data.id)

    // Update leaderboard if valid session (this will be called separately from API now)
    // if (isValid) {
    //   await updateLeaderboard(user.id, sessionData.score, sessionData.tokensCollected)
    // }

    return data
  } catch (error) {
    console.error('Critical error in createGameSession:', error)
    throw error
  }
}

export const getUserGameSessions = async (userId: string, limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user game sessions:', error)
    throw error
  }
}

export const getDailyGameCount = async (walletAddress: string) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count, error } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress)
      .eq('is_valid', true)
      .gte('created_at', today.toISOString())

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error fetching daily game count:', error)
    return 0
  }
}

// Leaderboard functions with comprehensive fixes
export const updateLeaderboard = async (userId: string, newScore: number, tokensCollected: number) => {
  try {
    console.log('Updating leaderboard for user:', userId, 'Score:', newScore, 'Tokens:', tokensCollected)
    
    // Use upsert with atomic operations to prevent race conditions
    const { data: existingEntry, error: fetchError } = await supabase
      .from('game_leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching existing leaderboard entry:', fetchError)
      throw fetchError
    }

    if (existingEntry) {
      console.log('Existing entry found:', existingEntry)
      
      // Always update total_games, total_tokens_collected, and total_score
      const updates = {
        total_games: existingEntry.total_games + 1,
        total_tokens_collected: existingEntry.total_tokens_collected + tokensCollected,
        total_score: (existingEntry.total_score || 0) + newScore,
        updated_at: new Date().toISOString()
      }
      
      // Only update high_score if new score is higher
      if (newScore > (existingEntry as any).high_score) {
        (updates as any).high_score = newScore
        console.log('New high score achieved:', newScore, 'Previous:', (existingEntry as any).high_score)
      }

      const { data, error } = await supabase
        .from('game_leaderboard')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating leaderboard:', error)
        throw error
      }
      
      console.log('Leaderboard updated successfully:', data)
      
      // Always refresh ranks after any update
      await refreshLeaderboardRanks()
      
      return data
    } else {
      console.log('Creating new leaderboard entry')
      
      // Get user info for new entry
      const { data: userInfo, error: userError } = await supabase
        .from('game_users')
        .select('wallet_address, username, is_verified')
        .eq('id', userId)
        .single()

      if (userError || !userInfo) {
        console.error('Error fetching user info:', userError)
        throw userError || new Error('User not found')
      }

      const { data, error } = await supabase
        .from('game_leaderboard')
        .insert({
          user_id: userId,
          wallet_address: userInfo.wallet_address,
          username: userInfo.username,
          high_score: newScore,
          total_score: newScore,
          total_games: 1,
          total_tokens_collected: tokensCollected
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating new leaderboard entry:', error)
        throw error
      }
      
      console.log('New leaderboard entry created:', data)
      
      // Refresh ranks after new entry
      await refreshLeaderboardRanks()
      
      return data
    }
  } catch (error) {
    console.error('Critical error in updateLeaderboard:', error)
    throw error
  }
}

// Function to manually refresh leaderboard ranks
export const refreshLeaderboardRanks = async () => {
  try {
    const { error } = await supabase.rpc('refresh_leaderboard_ranks')
    if (error) throw error
  } catch (error) {
    console.error('Error refreshing leaderboard ranks:', error)
    // Don't throw as this is not critical
  }
}

export const getLeaderboard = async (limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('game_leaderboard')
      .select(`
        *,
        game_users!inner(username, wallet_address, is_verified)
      `)
      .order('total_score', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    throw error
  }
}

export const getUserRank = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('game_leaderboard')
      .select('rank_position, high_score, total_score')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user rank:', error)
    return null
  }
}

// Achievement functions
export const createAchievement = async (userId: string, achievementType: string, achievementData: any = {}) => {
  try {
    const { data, error } = await supabase
      .from('game_achievements')
      .insert([{
        user_id: userId,
        achievement_type: achievementType,
        achievement_data: achievementData
      }])
      .select()
      .single()

    if (error && error.code !== '23505') { // Ignore duplicate constraint errors
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Error creating achievement:', error)
    return null
  }
}

export const getUserAchievements = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('game_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user achievements:', error)
    throw error
  }
}

// Admin functions
export const banUser = async (walletAddress: string, banned: boolean = true) => {
  try {
    const { data, error } = await supabase
      .from('game_users')
      .update({ is_banned: banned })
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user ban status:', error)
    throw error
  }
}

export const getGameStats = async () => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('game_users')
      .select('*', { count: 'exact', head: true })

    // Get total games played
    const { count: totalGames } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_valid', true)

    // Get games played today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: todayGames } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_valid', true)
      .gte('created_at', today.toISOString())

    // Get highest score
    const { data: highestScore } = await supabase
      .from('game_leaderboard')
      .select('high_score')
      .order('high_score', { ascending: false })
      .limit(1)
      .single()

    return {
      totalUsers: totalUsers || 0,
      totalGames: totalGames || 0,
      todayGames: todayGames || 0,
      highestScore: highestScore?.high_score || 0
    }
  } catch (error) {
    console.error('Error fetching game stats:', error)
    return {
      totalUsers: 0,
      totalGames: 0,
      todayGames: 0,
      highestScore: 0
    }
  }
}

// Utility function to redact wallet address for privacy
export const redactWalletAddress = (walletAddress: string): string => {
  if (!walletAddress || walletAddress.length < 8) {
    return 'Invalid Address'
  }
  
  // Show first 4 and last 4 characters with dots in between
  return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
}

export interface Feedback {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  admin_response?: string
  created_at: string
  updated_at: string
}

// ============ FEEDBACK DATABASE FUNCTIONS ============

export const createFeedback = async (feedback: {
  name: string
  email: string
  subject: string
  message: string
}) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedback])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating feedback:', error)
    throw error
  }
}

export const getAllFeedback = async () => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching feedback:', error)
    throw error
  }
}

export const updateFeedback = async (id: string, updates: Partial<Feedback>) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating feedback:', error)
    throw error
  }
}

export const deleteFeedback = async (id: string) => {
  try {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting feedback:', error)
    throw error
  }
}

export const markFeedbackAsRead = async (id: string) => {
  try {
    return await updateFeedback(id, { is_read: true })
  } catch (error) {
    console.error('Error marking feedback as read:', error)
    throw error
  }
}

export const addAdminResponse = async (id: string, response: string) => {
  try {
    return await updateFeedback(id, { 
      admin_response: response, 
      is_read: true 
    })
  } catch (error) {
    console.error('Error adding admin response:', error)
    throw error
  }
}

export const getFeedbackStats = async () => {
  try {
    const { data: allFeedback, error } = await supabase
      .from('feedback')
      .select('is_read, created_at')

    if (error) throw error

    const total = allFeedback?.length || 0
    const unread = allFeedback?.filter(f => !f.is_read).length || 0
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recent = allFeedback?.filter(f => new Date(f.created_at) > oneDayAgo).length || 0

    return { total, unread, recent }
  } catch (error) {
    console.error('Error fetching feedback stats:', error)
    return { total: 0, unread: 0, recent: 0 }
  }
} 