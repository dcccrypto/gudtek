import { NextRequest, NextResponse } from 'next/server'
import { createGameSession, updateLeaderboard } from '@/lib/supabase'
import crypto from 'crypto'

// Rate limiting store (in production, use Redis or database)
const submissionTracker = new Map<string, { lastSubmission: number; recentScores: Array<{ score: number; timestamp: number }> }>()

// Utility to validate score data
function validateScoreData(scoreData: any) {
  const requiredFields = ['walletAddress', 'score', 'durationMs', 'tokensCollected', 'obstaclesHit']
  const errors = []

  for (const field of requiredFields) {
    if (scoreData[field] === undefined || scoreData[field] === null) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  // Type validation
  if (typeof scoreData.score !== 'number' || scoreData.score < 0) {
    errors.push('Score must be a non-negative number')
  }
  
  if (typeof scoreData.durationMs !== 'number' || scoreData.durationMs <= 0) {
    errors.push('Duration must be a positive number')
  }
  
  if (typeof scoreData.tokensCollected !== 'number' || scoreData.tokensCollected < 0) {
    errors.push('Tokens collected must be a non-negative number')
  }
  
  if (typeof scoreData.obstaclesHit !== 'number' || scoreData.obstaclesHit < 0) {
    errors.push('Obstacles hit must be a non-negative number')
  }

  // Enhanced sanity checks for potential cheating
  if (scoreData.score > 100000) {
    errors.push('Score appears unusually high - possible cheating detected')
  }
  
  if (scoreData.durationMs < 5000) {
    errors.push('Game duration too short - minimum 5 seconds required')
  }
  
  if (scoreData.tokensCollected > scoreData.score) {
    errors.push('Tokens collected cannot exceed score')
  }

  return errors
}

// Enhanced rate limiting and duplicate prevention
function checkRateLimit(walletAddress: string, newScore: number): { allowed: boolean; reason?: string } {
  const now = Date.now()
  const tracker = submissionTracker.get(walletAddress)
  
  if (!tracker) {
    // First submission for this wallet
    submissionTracker.set(walletAddress, {
      lastSubmission: now,
      recentScores: [{ score: newScore, timestamp: now }]
    })
    return { allowed: true }
  }

  // Check minimum time between submissions (prevent rapid clicking)
  const timeSinceLastSubmission = now - tracker.lastSubmission
  if (timeSinceLastSubmission < 3000) { // 3 second minimum between submissions
    return { 
      allowed: false, 
      reason: `Please wait ${Math.ceil((3000 - timeSinceLastSubmission) / 1000)} seconds before submitting again` 
    }
  }

  // Clean old scores (older than 5 minutes)
  tracker.recentScores = tracker.recentScores.filter(entry => now - entry.timestamp < 300000)

  // Check for duplicate scores in recent submissions (within 5 minutes)
  const duplicateScore = tracker.recentScores.find(entry => entry.score === newScore)
  if (duplicateScore) {
    const minutesAgo = Math.ceil((now - duplicateScore.timestamp) / 60000)
    return { 
      allowed: false, 
      reason: `You already submitted score ${newScore} ${minutesAgo} minute(s) ago. Please play a new game to submit a different score.` 
    }
  }

  // Check submission frequency (max 10 submissions per hour)
  const recentSubmissions = tracker.recentScores.filter(entry => now - entry.timestamp < 3600000) // 1 hour
  if (recentSubmissions.length >= 10) {
    return { 
      allowed: false, 
      reason: 'Too many submissions in the last hour. Please wait before submitting more scores.' 
    }
  }

  // Update tracker
  tracker.lastSubmission = now
  tracker.recentScores.push({ score: newScore, timestamp: now })
  submissionTracker.set(walletAddress, tracker)
  
  return { allowed: true }
}

// Generate session hash for anti-cheat validation
function generateSessionHash(scoreData: any, clientIP: string): string {
  const dataString = `${scoreData.walletAddress}-${scoreData.score}-${scoreData.durationMs}-${scoreData.tokensCollected}-${clientIP}-${Date.now()}`
  return crypto.createHash('sha256').update(dataString).digest('hex')
}

export async function POST(request: NextRequest) {
  let scoreData: any = null
  
  try {
    scoreData = await request.json()
    console.log('Score submission received:', {
      walletAddress: scoreData.walletAddress,
      score: scoreData.score,
      tokensCollected: scoreData.tokensCollected,
      durationMs: scoreData.durationMs,
      obstaclesHit: scoreData.obstaclesHit
    })

    // Validate score data
    const validationErrors = validateScoreData(scoreData)
    if (validationErrors.length > 0) {
      console.error('Score validation failed:', validationErrors)
      return NextResponse.json(
        { 
          error: 'Invalid score data',
          details: validationErrors,
          success: false
        },
        { status: 400 }
      )
    }

    // Check rate limiting and duplicate prevention
    const rateLimitCheck = checkRateLimit(scoreData.walletAddress, scoreData.score)
    if (!rateLimitCheck.allowed) {
      console.warn('Score submission blocked by rate limiting:', {
        wallet: scoreData.walletAddress,
        score: scoreData.score,
        reason: rateLimitCheck.reason
      })
      return NextResponse.json(
        { 
          error: 'Submission blocked',
          details: rateLimitCheck.reason,
          success: false
        },
        { status: 429 } // Too Many Requests
      )
    }

    // Get client IP for anti-cheat measures
    const clientIP = request.ip || 
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Generate session hash
    const sessionHash = generateSessionHash(scoreData, clientIP)

    console.log('Creating game session with hash:', sessionHash)

    // Create game session with all anti-cheat data
    const session = await createGameSession({
      walletAddress: scoreData.walletAddress,
      score: scoreData.score,
      durationMs: scoreData.durationMs,
      tokensCollected: scoreData.tokensCollected,
      obstaclesHit: scoreData.obstaclesHit,
      sessionHash,
      ipAddress: clientIP,
      userAgent
    })

    console.log('Game session created successfully:', {
      sessionId: session.id,
      userId: session.user_id,
      score: session.score
    })

    // Update leaderboard if session was created successfully
    if (session.user_id) {
      console.log('Updating leaderboard for user:', session.user_id)
      
      const leaderboardEntry = await updateLeaderboard(
        session.user_id,
        scoreData.score,
        scoreData.tokensCollected
      )

      console.log('Leaderboard updated successfully:', {
        userId: leaderboardEntry.user_id,
        highScore: leaderboardEntry.high_score,
        totalGames: leaderboardEntry.total_games
      })

      // Return comprehensive success response
      return NextResponse.json({
        success: true,
        message: 'Score submitted successfully',
        session: {
          id: session.id,
          score: session.score,
          isValid: session.is_valid
        },
        leaderboard: {
          highScore: leaderboardEntry.high_score,
          totalScore: leaderboardEntry.total_score,
          totalGames: leaderboardEntry.total_games,
          totalTokens: leaderboardEntry.total_tokens_collected,
          isNewHighScore: scoreData.score === leaderboardEntry.high_score
        },
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('Session created but no user_id returned')
      return NextResponse.json(
        { 
          error: 'Session created but user association failed',
          success: false
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Critical error in score submission:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      scoreData: scoreData ? {
        walletAddress: scoreData.walletAddress,
        score: scoreData.score
      } : 'No score data parsed'
    })

    return NextResponse.json(
      { 
        error: 'Failed to submit score',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
} 