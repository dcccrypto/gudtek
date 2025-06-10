'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, 
  Play, 
  Wallet, 
  Shield, 
  Twitter, 
  RotateCcw, 
  Crown,
  Target,
  Coins,
  Clock,
  Star,
  Settings,
  Users,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  getWalletInfo, 
  formatTokenBalance, 
  formatSolBalance,
  MIN_GUDTEK_BALANCE
} from '@/lib/wallet'
import { toast } from '@/hooks/use-toast'

interface GameState {
  player: {
    x: number
    y: number
    width: number
    height: number
  }
  tokens: Array<{
    id: number
    x: number
    y: number
    width: number
    height: number
  }>
  obstacles: Array<{
    id: number
    x: number
    y: number
    width: number
    height: number
    type: 'rug' | 'fud' | 'bear' | 'paper' | 'scam'
  }>
  score: number
  tokensCollected: number
  obstaclesHit: number
  gameRunning: boolean
  gameStartTime: number
  lives: number
}

interface LeaderboardEntry {
  rank: number
  username: string
  highScore: number
  totalScore: number
  totalGames: number
  totalTokens: number
  isVerified: boolean
}

// Replace use-sound import with native Audio API class
class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement[] } = {}
  private maxInstances = 3 // Maximum concurrent instances per sound
  
  constructor() {
    this.preloadSounds()
  }
  
  private preloadSounds() {
    const soundFiles = {
      gameStart: '/gamesounds/game-start.wav',
      tokenCollect: '/gamesounds/token-collect.wav',
      obstacleHit: '/gamesounds/obstacle-hit.mp3',
      lifeLost: '/gamesounds/life-lost.mp3',
      gameOver: '/gamesounds/game-over.wav'
    }
    
    Object.entries(soundFiles).forEach(([key, src]) => {
      this.sounds[key] = []
      for (let i = 0; i < this.maxInstances; i++) {
        const audio = new Audio(src)
        audio.preload = 'auto'
        audio.volume = this.getVolumeForSound(key)
        this.sounds[key].push(audio)
      }
    })
  }
  
  private getVolumeForSound(soundKey: string): number {
    const volumes = {
      gameStart: 0.5,
      tokenCollect: 0.3,
      obstacleHit: 0.4,
      lifeLost: 0.6,
      gameOver: 0.7
    }
    return volumes[soundKey as keyof typeof volumes] || 0.5
  }
  
  play(soundKey: string, options: { playbackRate?: number; volume?: number } = {}) {
    if (!this.sounds[soundKey]) {
      console.warn(`Sound ${soundKey} not found`)
      return
    }
    
    // Find an available audio instance (not currently playing)
    let audioInstance = this.sounds[soundKey].find(audio => audio.paused || audio.ended)
    
    // If no available instance, use the first one (interrupt it)
    if (!audioInstance) {
      audioInstance = this.sounds[soundKey][0]
    }
    
    try {
      audioInstance.currentTime = 0 // Reset to beginning
      
      if (options.playbackRate) {
        audioInstance.playbackRate = options.playbackRate
      } else {
        audioInstance.playbackRate = 1.0
      }
      
      if (options.volume !== undefined) {
        audioInstance.volume = Math.max(0, Math.min(1, options.volume))
      }
      
      const playPromise = audioInstance.play()
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Failed to play ${soundKey}:`, error)
        })
      }
      
      console.log(`🔊 Playing ${soundKey} (rate: ${audioInstance.playbackRate}, volume: ${audioInstance.volume})`)
    } catch (error) {
      console.warn(`Error playing ${soundKey}:`, error)
    }
  }
  
  setMasterVolume(volume: number) {
    Object.entries(this.sounds).forEach(([soundKey, audioArray]) => {
      audioArray.forEach(audio => {
        const baseVolume = this.getVolumeForSound(soundKey)
        audio.volume = Math.max(0, Math.min(1, volume * baseVolume))
      })
    })
  }
  
  // Method to check if sound manager is ready
  isReady(): boolean {
    return Object.keys(this.sounds).length > 0
  }
}

export default function GamePage() {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const [mounted, setMounted] = useState(false)
  
  // Contest timing state
  const [contestInfo, setContestInfo] = useState({
    isFirst24Hours: true,
    timeRemaining: '',
    nextAirdropDate: '18/06/2025'
  })
  
  // Sound effects state - initialize from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tokenDodgeSoundEnabled')
      return saved !== null ? JSON.parse(saved) : true
    }
    return true
  })
  
  // Sound manager using native Audio API for better performance and reliability
  const soundManagerRef = useRef<SoundManager | null>(null)
  
  // Initialize sound manager on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !soundManagerRef.current) {
      soundManagerRef.current = new SoundManager()
      console.log('🔊 Sound manager initialized')
    }
  }, [])
  
  // Wallet info state (like memes page)
  const [walletInfo, setWalletInfo] = useState({
    gudtekBalance: 0,
    solBalance: 0,
    canVote: false,
    canSubmit: false
  })
  const [walletLoading, setWalletLoading] = useState(false)
  
  // Navigation state
  const [isNavOpen, setIsNavOpen] = useState(false)
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    player: { x: 50, y: 200, width: 50, height: 50 },
    tokens: [],
    obstacles: [],
    score: 0,
    tokensCollected: 0,
    obstaclesHit: 0,
    gameRunning: false,
    gameStartTime: 0,
    lives: 3
  })
  
  // UI state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<{ rank: number; highScore: number; totalScore?: number } | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Game constants - optimized for performance
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 400
  const PLAYER_SPEED = 5
  const GAME_SPEED = 2
  const FPS_TARGET = 60
  const FRAME_TIME = 1000 / FPS_TARGET

  // Responsive canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
  const [coinImage, setCoinImage] = useState<HTMLImageElement | null>(null)
  const [dogImage, setDogImage] = useState<HTMLImageElement | null>(null)
  
  // Obstacle images
  const [obstacleImages, setObstacleImages] = useState<{
    bear: HTMLImageElement | null
    fud: HTMLImageElement | null
    paperhands: HTMLImageElement | null
    rug: HTMLImageElement | null
    scam: HTMLImageElement | null
  }>({
    bear: null,
    fud: null,
    paperhands: null,
    rug: null,
    scam: null
  })

  // Navigation items matching main site
  const navItems = [
    { name: "Home", href: "/" },
    { name: "Game", href: "/game" },
    { name: "Announcements", href: "/announcements" },
    { name: "Hackathon", href: "/#hackathon" },
    { name: "Tokenomics", href: "/#tokenomics" },
    { name: "How to Buy", href: "/#how-to-buy" },
    { name: "Chart", href: "/#chart" },
    { name: "Memes", href: "/memes" },
    { name: "Community", href: "/#community" },
    { name: "About", href: "/#about" },
  ]

  // Add new state for improved game logic
  const [difficultyLevel, setDifficultyLevel] = useState(1)
  const [lastObstacleTime, setLastObstacleTime] = useState(0)
  const [lastTokenTime, setLastTokenTime] = useState(0)
  const [obstaclePattern, setObstaclePattern] = useState<'random' | 'wave' | 'corridor' | 'cluster'>('random')
  const [patternProgress, setPatternProgress] = useState(0)
  
  // Performance monitoring
  const [frameRate, setFrameRate] = useState(60)
  const [renderTime, setRenderTime] = useState(0)
  
  // Sound effect enhancements
  const [tokenCollectCombo, setTokenCollectCombo] = useState(0)
  const [lastTokenCollectTime, setLastTokenCollectTime] = useState(0)
  const [audioContext, setAudioContext] = useState<'locked' | 'unlocked' | 'unsupported'>('locked')

  // Save sound preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenDodgeSoundEnabled', JSON.stringify(soundEnabled))
    }
  }, [soundEnabled])

  // Check audio context state and unlock if needed
  useEffect(() => {
    const checkAudioContext = () => {
      if (typeof window !== 'undefined' && window.AudioContext) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          if (ctx.state === 'suspended') {
            setAudioContext('locked')
          } else {
            setAudioContext('unlocked')
          }
        } catch (error) {
          console.warn('AudioContext not supported:', error)
          setAudioContext('unsupported')
        }
      }
    }

    checkAudioContext()
    
    // Try to unlock audio on user interaction
    const unlockAudio = async () => {
      if (typeof window !== 'undefined' && window.AudioContext) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          if (ctx.state === 'suspended') {
            await ctx.resume()
            setAudioContext('unlocked')
            console.log('🔊 Audio context unlocked')
          }
        } catch (error) {
          console.warn('Failed to unlock audio:', error)
        }
      }
    }

    // Add event listeners for user interactions
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, unlockAudio)
      })
    }
  }, [])

  // Enhanced localStorage integration based on GameDev.js best practices
  const saveLocalGameData = useCallback((score: number, gameData?: any) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Save high score immediately
        const currentLocalHigh = parseInt(localStorage.getItem('tokenDodgeHighScore') || '0')
        if (score > currentLocalHigh) {
          localStorage.setItem('tokenDodgeHighScore', score.toString())
          console.log('✅ New local high score saved:', score)
        }
        
        // Save game session to local history
        const localScores = JSON.parse(localStorage.getItem('tokenDodgeScores') || '[]')
        const sessionData = {
          score,
          timestamp: new Date().toISOString(),
          tokensCollected: gameData?.tokensCollected || 0,
          duration: gameData?.duration || 0,
          ...gameData
        }
        
        localScores.unshift(sessionData) // Add to beginning
        localStorage.setItem('tokenDodgeScores', JSON.stringify(localScores.slice(0, 50))) // Keep last 50 scores
        
        console.log('✅ Local game data saved:', sessionData)
      } catch (error) {
        console.error('❌ Error saving local game data:', error)
      }
    }
  }, [])

  // Load local high score and game data
  const loadLocalGameData = useCallback(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Load local high score
        const localHighScore = parseInt(localStorage.getItem('tokenDodgeHighScore') || '0')
        setHighScore(Math.max(localHighScore, highScore))
        console.log('📱 Loaded local high score:', localHighScore)
        
        // Load local scores for offline viewing
        const localScores = JSON.parse(localStorage.getItem('tokenDodgeScores') || '[]')
        console.log('📱 Loaded local scores:', localScores.length, 'scores')
        
        // Load user preferences
        const prefs = JSON.parse(localStorage.getItem('tokenDodgePrefs') || '{}')
        if (prefs.volume !== undefined) {
          // Could add sound settings here in future
        }
      } catch (error) {
        console.error('❌ Error loading local game data:', error)
      }
    }
  }, [highScore])

  // Contest timing logic
  useEffect(() => {
    const updateContestTimer = () => {
      // Set the contest start time (you can adjust this to when you want the 24h contest to start)
      // 
      // FOR PRODUCTION: Replace the line below with your actual contest start time
      // Example: const contestStartTime = new Date('2025-01-24T00:00:00.000Z').getTime()
      // 
      // For testing: set to current time minus some hours to see the countdown
      const contestStartTime = Date.now() - (20 * 60 * 60 * 1000) // Started 20 hours ago for demo (4h left)
      const currentTime = Date.now()
      const contestEndTime = contestStartTime + (24 * 60 * 60 * 1000) // 24 hours from start
      const timeLeftMs = contestEndTime - currentTime
      
      if (timeLeftMs > 0) {
        // Still in first 24 hours - calculate remaining time
        const totalSecondsLeft = Math.floor(timeLeftMs / 1000)
        const hoursLeft = Math.floor(totalSecondsLeft / 3600)
        const minutesLeft = Math.floor((totalSecondsLeft % 3600) / 60)
        const secondsLeft = totalSecondsLeft % 60
        
        let timeDisplay = ''
        if (hoursLeft > 0) {
          timeDisplay = `${hoursLeft}h ${minutesLeft}m`
        } else if (minutesLeft > 0) {
          timeDisplay = `${minutesLeft}m ${secondsLeft}s`
        } else {
          timeDisplay = `${secondsLeft}s`
        }
        
        setContestInfo({
          isFirst24Hours: true,
          timeRemaining: timeDisplay,
          nextAirdropDate: '18/06/2025'
        })
      } else {
        // Contest has ended - switch to weekly contest
        setContestInfo({
          isFirst24Hours: false,
          timeRemaining: '',
          nextAirdropDate: '18/06/2025'
        })
      }
    }

    // Update immediately
    updateContestTimer()
    
    // Update every 30 seconds - more reasonable interval
    const timer = setInterval(updateContestTimer, 30000)
    
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setMounted(true)
    loadLeaderboard()
    loadCoinImage()
    loadDogImage()
    loadObstacleImages()
    loadLocalGameData()
    updateCanvasSize()
    
    // Handle window resize for responsive canvas
    const handleResize = () => updateCanvasSize()
    window.addEventListener('resize', handleResize)
    
    console.log('Game component mounted')
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [loadLocalGameData])

  // Load wallet info when wallet connects (like memes page)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (connected && publicKey) {
      loadWalletInfo()
    } else {
      setWalletInfo({
        gudtekBalance: 0,
        solBalance: 0,
        canVote: false,
        canSubmit: false
      })
    }
  }, [connected, publicKey])

  const loadWalletInfo = async () => {
    if (!publicKey) return
    
    setWalletLoading(true)
    try {
      const info = await getWalletInfo(publicKey.toString())
      setWalletInfo(info)
    } catch (error) {
      console.error('Error loading wallet info:', error)
      toast({
        title: "Error",
        description: "Failed to load wallet information",
        variant: "destructive",
      })
    } finally {
      setWalletLoading(false)
    }
  }

  // Load leaderboard
  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/game/leaderboard?limit=10')
      const data = await response.json()
      if (data.success) {
        setLeaderboard(data.leaderboard)
        if (connected && publicKey) {
          setUserRank(data.userRank)
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  // Optimized image loading with caching and preloading
  const loadCoinImage = useCallback(() => {
    const img = new Image()
    img.onload = () => {
      console.log('✅ Coin image loaded successfully')
      setCoinImage(img)
    }
    img.onerror = () => {
      console.error('❌ Failed to load coin image')
    }
    img.crossOrigin = 'anonymous' // Enable CORS for better caching
    img.src = '/game/coin.png'
  }, [])

  // Optimized dog image loading 
  const loadDogImage = useCallback(() => {
    const img = new Image()
    img.onload = () => {
      console.log('✅ Dog image loaded successfully')
      setDogImage(img)
    }
    img.onerror = () => {
      console.error('❌ Failed to load dog image')
    }
    img.crossOrigin = 'anonymous'
    img.src = '/game/dog.png'
  }, [])

  // Optimized obstacle images loading with batching
  const loadObstacleImages = useCallback(() => {
    const obstacleTypes = ['bear', 'fud', 'paperhands', 'rug', 'scam']
    let loadedCount = 0
    const totalImages = obstacleTypes.length
    
    obstacleTypes.forEach(type => {
      const img = new Image()
      img.onload = () => {
        loadedCount++
        console.log(`✅ ${type} obstacle image loaded (${loadedCount}/${totalImages})`)
        setObstacleImages(prev => ({
          ...prev,
          [type]: img
        }))
        if (loadedCount === totalImages) {
          console.log('🎮 All obstacle images loaded - game ready!')
        }
      }
      img.onerror = () => {
        console.error(`❌ Failed to load ${type} obstacle image`)
      }
      img.crossOrigin = 'anonymous'
      img.src = `/game/${type === 'paperhands' ? 'paperhands' : type}.png`
    })
  }, [])

  // Update canvas size for mobile responsiveness
  const updateCanvasSize = () => {
    const isMobile = window.innerWidth < 768
    const containerWidth = Math.min(window.innerWidth - 32, CANVAS_WIDTH) // 32px for padding
    const aspectRatio = CANVAS_HEIGHT / CANVAS_WIDTH
    
    if (isMobile) {
      const mobileWidth = Math.min(containerWidth, 600)
      const mobileHeight = mobileWidth * aspectRatio
      setCanvasDimensions({ width: mobileWidth, height: mobileHeight })
    } else {
      setCanvasDimensions({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
    }
  }

  // Handle mobile touch controls
  const handleMobileMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!gameState.gameRunning) return
    
    setGameState(prev => {
      if (!prev.gameRunning) return prev
      
      const newState = { ...prev }
      switch (direction) {
        case 'up':
          newState.player.y = Math.max(0, newState.player.y - PLAYER_SPEED * 2) // Double speed for touch
          break
        case 'down':
          newState.player.y = Math.min(CANVAS_HEIGHT - newState.player.height, newState.player.y + PLAYER_SPEED * 2)
          break
        case 'left':
          newState.player.x = Math.max(0, newState.player.x - PLAYER_SPEED * 2)
          break
        case 'right':
          newState.player.x = Math.min(CANVAS_WIDTH - newState.player.width, newState.player.x + PLAYER_SPEED * 2)
          break
      }
      return newState
    })
  }

  // Performance-monitored game loop with optimizations
  const gameLoop = useCallback(() => {
    const startTime = performance.now() // Performance monitoring
    
    setGameState(prev => {
      if (!prev.gameRunning) return prev

      const canvas = canvasRef.current
      if (!canvas) return prev

      const ctx = canvas.getContext('2d')!
      const { width: canvasW, height: canvasH } = canvasDimensions
      
      // Calculate scaling factors for mobile (cached)
      const scaleX = canvasW / CANVAS_WIDTH
      const scaleY = canvasH / CANVAS_HEIGHT
      
      // Clear canvas with optimized gradient (reuse gradient object)
      const gameLoopCache = gameLoop as any // Type assertion for dynamic properties
      if (!gameLoopCache.gradient || gameLoopCache.lastCanvasW !== canvasW || gameLoopCache.lastCanvasH !== canvasH) {
        gameLoopCache.gradient = ctx.createLinearGradient(0, 0, canvasW, canvasH)
        gameLoopCache.gradient.addColorStop(0, '#f97316')
        gameLoopCache.gradient.addColorStop(0.5, '#eab308')
        gameLoopCache.gradient.addColorStop(1, '#f97316')
        gameLoopCache.lastCanvasW = canvasW
        gameLoopCache.lastCanvasH = canvasH
      }
      ctx.fillStyle = gameLoopCache.gradient
      ctx.fillRect(0, 0, canvasW, canvasH)
      
      // Optimized animated background pattern (reduced frequency)
      const time = Date.now() * 0.001
      const gridSize = 50
      const gridStep = gridSize * Math.max(scaleX, scaleY)
      
      // Only draw background pattern every few frames for performance
      if (!gameLoopCache.frameCount) gameLoopCache.frameCount = 0
      gameLoopCache.frameCount++
      
      if (gameLoopCache.frameCount % 3 === 0) { // Only every 3rd frame
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        for (let i = 0; i < canvasW; i += gridStep) {
          for (let j = 0; j < canvasH; j += gridStep) {
            const offset = Math.sin(time + i * 0.01 + j * 0.01) * 5
            ctx.beginPath()
            ctx.arc(i + offset, j + offset, 2, 0, Math.PI * 2)
            ctx.stroke()
          }
        }
      }

      const newState = { ...prev }
      const currentTime = Date.now()
      
      // Use strategic obstacle and token spawning
      const spawnResult = spawnObstacles(currentTime, newState)
      newState.obstacles = spawnResult.obstacles
      newState.tokens = spawnResult.tokens
      
      // Optimized object movement with single-pass filtering
      const gameSpeed = GAME_SPEED
      const playerBounds = {
        left: newState.player.x,
        right: newState.player.x + newState.player.width,
        top: newState.player.y,
        bottom: newState.player.y + newState.player.height
      }
      
      // Move and filter tokens in single pass with optimized collision detection
      const activeTokens = []
      let tokensCollectedThisFrame = 0
      let scoreGainedThisFrame = 0
      
      for (let i = 0; i < newState.tokens.length; i++) {
        const token = newState.tokens[i]
        token.x -= gameSpeed
        
        // Skip if token is off-screen
        if (token.x <= -token.width) continue
        
        // Optimized AABB collision detection
        if (playerBounds.left < token.x + token.width &&
            playerBounds.right > token.x &&
            playerBounds.top < token.y + token.height &&
            playerBounds.bottom > token.y) {
          scoreGainedThisFrame += 10
          tokensCollectedThisFrame++
          
          // Play token collection sound effect with rising pitch
          if (soundEnabled && soundManagerRef.current) {
            try {
              const currentTime = Date.now()
              // Reset combo if too much time has passed between collections
              if (currentTime - lastTokenCollectTime > 2000) {
                setTokenCollectCombo(0)
              }
              
              const newCombo = tokenCollectCombo + 1
              setTokenCollectCombo(newCombo)
              setLastTokenCollectTime(currentTime)
              
              // Play sound with increasing pitch for combo effect
              const pitchMultiplier = Math.min(1.0 + (newCombo * 0.1), 2.0) // Cap at 2x speed
              soundManagerRef.current.play('tokenCollect', { playbackRate: pitchMultiplier })
              console.log(`🪙 Token collect sound played (combo: ${newCombo}, pitch: ${pitchMultiplier.toFixed(1)}x)`)
            } catch (error) {
              console.warn('⚠️ Failed to play token collect sound:', error)
            }
          }
        } else {
          activeTokens.push(token)
        }
      }
      
      // Update stats from this frame
      newState.tokens = activeTokens
      newState.score += scoreGainedThisFrame
      newState.tokensCollected += tokensCollectedThisFrame
      
      // Move and filter obstacles in single pass with optimized collision detection
      const activeObstacles = []
      let collisionDetected = false
      
      for (let i = 0; i < newState.obstacles.length; i++) {
        const obstacle = newState.obstacles[i]
        obstacle.x -= gameSpeed
        
        // Skip if obstacle is off-screen
        if (obstacle.x <= -obstacle.width) continue
        
        // Optimized AABB collision detection
        if (playerBounds.left < obstacle.x + obstacle.width &&
            playerBounds.right > obstacle.x &&
            playerBounds.top < obstacle.y + obstacle.height &&
            playerBounds.bottom > obstacle.y) {
          collisionDetected = true
          const wasLastLife = newState.lives <= 1
          newState.lives--
          newState.obstaclesHit++
          
          // Play appropriate sound effect
          if (soundEnabled && soundManagerRef.current) {
            try {
              if (wasLastLife) {
                // Game over sound will be played when game ends
                soundManagerRef.current.play('lifeLost')
                console.log('💀 Life lost sound played (last life)')
              } else {
                soundManagerRef.current.play('obstacleHit')
                console.log('💥 Obstacle hit sound played')
              }
            } catch (error) {
              console.warn('⚠️ Failed to play collision sound:', error)
            }
          }
          
          if (newState.lives <= 0) {
            newState.gameRunning = false
            setGameOver(true)
            
            // Play game over sound
            if (soundEnabled && soundManagerRef.current) {
              setTimeout(() => {
                try {
                  soundManagerRef.current?.play('gameOver')
                  console.log('🎮 Game over sound played')
                } catch (error) {
                  console.warn('⚠️ Failed to play game over sound:', error)
                }
              }, 100) // Slight delay for better audio experience
            }
          }
        } else {
          activeObstacles.push(obstacle)
        }
      }
      
      newState.obstacles = activeObstacles

      // Batch rendering operations for better performance
      ctx.save()
      
      // Draw player (scaled for mobile)
      if (dogImage) {
        ctx.drawImage(
          dogImage,
          newState.player.x * scaleX, 
          newState.player.y * scaleY, 
          newState.player.width * scaleX, 
          newState.player.height * scaleY
        )
      } else {
        // Fallback to gray rectangle if dog image isn't loaded
        ctx.fillStyle = '#1f2937'
        ctx.fillRect(
          newState.player.x * scaleX, 
          newState.player.y * scaleY, 
          newState.player.width * scaleX, 
          newState.player.height * scaleY
        )
      }
      
      // Optimized token rendering with batching
      if (newState.tokens.length > 0) {
        if (coinImage) {
          // Batch image drawing operations
          newState.tokens.forEach(token => {
            ctx.drawImage(
              coinImage, 
              token.x * scaleX, 
              token.y * scaleY, 
              token.width * scaleX, 
              token.height * scaleY
            )
          })
        } else {
          // Batch fallback token rendering
          ctx.fillStyle = '#fbbf24'
          ctx.strokeStyle = '#f59e0b'
          ctx.lineWidth = 2
          const fontSize = 12 * Math.min(scaleX, scaleY)
          ctx.font = `${fontSize}px Arial`
          ctx.textAlign = 'center'
          
          newState.tokens.forEach(token => {
            const x = token.x * scaleX
            const y = token.y * scaleY
            const w = token.width * scaleX
            const h = token.height * scaleY
            const centerX = x + w/2
            const centerY = y + h/2
            
            ctx.beginPath()
            ctx.arc(centerX, centerY, w/2, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
            
            ctx.fillStyle = '#000000'
            ctx.fillText('$', centerX, centerY + 4 * scaleY)
            ctx.fillStyle = '#fbbf24' // Reset for next iteration
          })
        }
      }
      
      // Optimized obstacle rendering with custom images
      if (newState.obstacles.length > 0) {
        newState.obstacles.forEach(obstacle => {
          const x = obstacle.x * scaleX
          const y = obstacle.y * scaleY
          const w = obstacle.width * scaleX
          const h = obstacle.height * scaleY
          
          // Map obstacle types to image keys (handle 'paper' -> 'paperhands')
          const imageKey = obstacle.type === 'paper' ? 'paperhands' : obstacle.type
          const obstacleImage = obstacleImages[imageKey as keyof typeof obstacleImages]
          
          if (obstacleImage) {
            // Draw custom obstacle image
            ctx.drawImage(obstacleImage, x, y, w, h)
          } else {
            // Fallback to colored rectangle with emoji if image not loaded
            const obstacleColors = {
              'rug': '#dc2626',
              'fud': '#7c2d12', 
              'bear': '#991b1b',
              'paper': '#92400e',
              'scam': '#b91c1c'
            }
            
            const obstacleEmojis = {
              'rug': '💣',
              'fud': '☁️',
              'bear': '🐻', 
              'paper': '💸',
              'scam': '⚠️'
            }
            
            // Draw colored rectangle
            ctx.fillStyle = obstacleColors[obstacle.type as keyof typeof obstacleColors]
            ctx.fillRect(x, y, w, h)
            
            // Draw emoji overlay
            ctx.fillStyle = '#ffffff'
            ctx.font = `${20 * Math.min(scaleX, scaleY)}px Arial`
            ctx.textAlign = 'center'
            const emoji = obstacleEmojis[obstacle.type as keyof typeof obstacleEmojis]
            ctx.fillText(emoji, x + w/2, y + h/2 + 8 * scaleY)
          }
        })
      }
      
      ctx.restore()
      
      // Performance monitoring
      const endTime = performance.now()
      const renderDuration = endTime - startTime
      setRenderTime(renderDuration)
      
      // Log performance warnings if needed
      if (renderDuration > 16.67) { // Slower than 60 FPS
        console.warn(`🐌 Slow frame detected: ${renderDuration.toFixed(2)}ms`)
      }
      
      return newState
    })
  }, [canvasDimensions, coinImage, dogImage, obstacleImages])

  // Optimized game loop with frame rate control and delta timing
  useEffect(() => {
    console.log('Game loop effect triggered. gameRunning:', gameState.gameRunning, 'gameLoopRef.current:', gameLoopRef.current)
    
    if (gameState.gameRunning && !gameLoopRef.current) {
      console.log('Starting optimized game loop...')
      let lastFrameTime = performance.now()
      let fpsCounter = 0
      let fpsTime = 0
      
      const runLoop = (currentTime: number) => {
        const deltaTime = currentTime - lastFrameTime
        lastFrameTime = currentTime
        
        // Frame rate monitoring (for debug)
        fpsCounter++
        fpsTime += deltaTime
        if (fpsTime >= 1000) {
          // Reset FPS counter every second
          fpsCounter = 0
          fpsTime = 0
        }
        
        // Target 60 FPS - only update if enough time has passed
        if (deltaTime >= 16.67) { // ~60 FPS
          gameLoop()
        }
        
        if (gameState.gameRunning) {
          gameLoopRef.current = requestAnimationFrame(runLoop)
        }
      }
      gameLoopRef.current = requestAnimationFrame(runLoop)
    }
    
    return () => {
      if (gameLoopRef.current) {
        console.log('Cleaning up optimized game loop')
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = undefined
      }
    }
  }, [gameState.gameRunning, gameLoop])

  // Initialize game
  const initGame = useCallback(() => {
          setGameState({
        player: { x: 50, y: CANVAS_HEIGHT / 2 - 25, width: 50, height: 50 },
        tokens: [],
        obstacles: [],
        score: 0,
        tokensCollected: 0,
        obstaclesHit: 0,
        gameRunning: true,
        gameStartTime: Date.now(),
              lives: 3
    })
    setGameOver(false)
    setTokenCollectCombo(0)
    setLastTokenCollectTime(0)
  }, [])

  // Start game
  const startGame = () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to play the game",
        variant: "destructive",
      })
      return
    }

    if (walletInfo.gudtekBalance < MIN_GUDTEK_BALANCE) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${MIN_GUDTEK_BALANCE.toLocaleString()} $GUDTEK tokens to play`,
        variant: "destructive",
      })
      return
    }

    console.log('Starting game...') // Debug log
    
    // Make sure canvas is available
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas not found!')
      toast({
        title: "Game Error",
        description: "Canvas not initialized. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Canvas context not available!')
      toast({
        title: "Game Error", 
        description: "Canvas context not available. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    console.log('Canvas initialized, starting game...')
    initGame()
    
    // Play game start sound
    if (soundEnabled && soundManagerRef.current) {
      try {
        soundManagerRef.current.play('gameStart')
        console.log('🔊 Game start sound played')
      } catch (error) {
        console.warn('⚠️ Failed to play game start sound:', error)
      }
    }
    
    toast({
      title: "Game Started!",
      description: "Use Arrow Keys or WASD to move. Good luck!",
    })
  }

  // Handle player movement (with page scroll prevention)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameState.gameRunning) return
      
      // Prevent default behavior for game keys to stop page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault()
      }
      
      setGameState(prev => {
        if (!prev.gameRunning) return prev
        
        const newState = { ...prev }
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            newState.player.y = Math.max(0, newState.player.y - PLAYER_SPEED)
            break
          case 'ArrowDown':
          case 's':
          case 'S':
            newState.player.y = Math.min(CANVAS_HEIGHT - newState.player.height, newState.player.y + PLAYER_SPEED)
            break
          case 'ArrowLeft':
          case 'a':
          case 'A':
            newState.player.x = Math.max(0, newState.player.x - PLAYER_SPEED)
            break
          case 'ArrowRight':
          case 'd':
          case 'D':
            newState.player.x = Math.min(CANVAS_WIDTH - newState.player.width, newState.player.x + PLAYER_SPEED)
            break
        }
        return newState
      })
    }

    if (gameState.gameRunning) {
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [gameState.gameRunning])

  // Enhanced score submission with comprehensive error handling and localStorage backup
  const submitScore = async () => {
    const finalScore = gameState.score
    const duration = Date.now() - gameState.gameStartTime
    
    console.log('🎮 Game ended - Score:', finalScore, 'Duration:', duration + 'ms')
    
    // ALWAYS save locally first (offline-first approach per GameDev.js best practices)
    const gameData = {
      tokensCollected: gameState.tokensCollected,
      obstaclesHit: gameState.obstaclesHit,
      duration: duration,
      lives: gameState.lives
    }
    saveLocalGameData(finalScore, gameData)
    
    // Update high score immediately
    if (finalScore > highScore) {
      setHighScore(finalScore)
    }

    // If not connected, show local-only confirmation
    if (!connected || !publicKey) {
      console.log('📱 Playing offline - score saved locally')
      toast({
        title: "Score Saved Locally",
        description: `Score: ${finalScore}. Connect wallet to submit to global leaderboard!`,
      })
      return
    }

    // If connected but submitting already, prevent double submission
    if (isSubmitting) return
    
    setIsSubmitting(true)
    console.log('🚀 Submitting to global leaderboard...')

    try {
      // Use new streamlined score submission format
      const scoreData = {
        walletAddress: publicKey.toString(),
        score: finalScore,
        durationMs: duration,
        tokensCollected: gameState.tokensCollected,
        obstaclesHit: gameState.obstaclesHit
      }

      console.log('📊 Score data being submitted:', scoreData)

      // Add detailed logging for debugging
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const apiUrl = '/api/game/submit-score'
      console.log('🌐 Making request to:', baseUrl + apiUrl)
      console.log('🔒 Current protocol:', window.location.protocol)
      console.log('🏠 Current host:', window.location.host)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📊 Server response:', result)

      if (result.success) {
        console.log('✅ Score submitted to global leaderboard!')
        
        const isNewHighScore = result.leaderboard?.isNewHighScore
        const totalGames = result.leaderboard?.totalGames || 1
        
        const message = isNewHighScore 
          ? `🎉 NEW HIGH SCORE! ${finalScore} points!`
          : `Score ${finalScore} submitted! (Game #${totalGames})`
          
        toast({
          title: isNewHighScore ? "🏆 New High Score!" : "Score Submitted!",
          description: message,
        })
        
        // Refresh leaderboard to show updated scores with small delay for DB consistency
        setTimeout(() => loadLeaderboard(), 1500)
        
      } else {
        throw new Error(result.details || result.error || 'Unknown server error')
      }
    } catch (error) {
      console.error('❌ Server submission failed:', error)
      
      // More specific error messages based on error type
      let errorMessage = `Score ${finalScore} saved locally. Global leaderboard will sync when server is available.`
      let errorTitle = "Server Issue"
      
      if (error instanceof Error) {
        if (error.message.includes('SSL_PROTOCOL_ERROR') || error.message.includes('HTTPS')) {
          errorTitle = "Connection Issue"
          errorMessage = "SSL/HTTPS connection error. Your score is saved locally. Try refreshing the page."
        } else if (error.message.includes('Failed to fetch')) {
          errorTitle = "Network Error"
          errorMessage = "Network connection failed. Your score is saved locally and will sync when connection is restored."
        }
      }
      
      // Graceful fallback - user's score is still saved locally
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
      
      // Could implement retry queue here for future enhancement
    } finally {
      setIsSubmitting(false)
    }
  }

  // Lazy-loaded victory image generation (only when needed)
  const generateVictoryImage = useCallback(async () => {
    return new Promise<string>((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Set canvas size for Twitter image (1200x630 is optimal)
      canvas.width = 1200
      canvas.height = 630
      
      // Create vibrant gradient background matching game colors
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#f97316') // Orange (matching game)
      gradient.addColorStop(0.5, '#eab308') // Yellow (matching game)
      gradient.addColorStop(1, '#f97316') // Orange
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add subtle pattern overlay
      ctx.globalAlpha = 0.1
      for (let i = 0; i < canvas.width; i += 60) {
        for (let j = 0; j < canvas.height; j += 60) {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(i, j, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      
      // Load and draw logo
      const logo = new Image()
      logo.onload = () => {
        // Draw logo in top-left
        const logoSize = 120
        ctx.drawImage(logo, 50, 40, logoSize, logoSize)
        
        // Add main title with bold shadow effect
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 64px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('VICTORY!', canvas.width / 2 + 3, 123) // Shadow
        ctx.fillStyle = '#ffffff'
        ctx.fillText('VICTORY!', canvas.width / 2, 120)
        
        // Add subtitle with matching colors
        ctx.font = 'bold 32px Arial'
        ctx.fillStyle = '#000000'
        ctx.fillText('Token Dodge Game Stats', canvas.width / 2 + 2, 172) // Shadow
        ctx.fillStyle = '#ffffff'
        ctx.fillText('Token Dodge Game Stats', canvas.width / 2, 170)
        
        // Draw individual stat cards instead of one big box (game-style)
        const stats = [
          { label: 'Final Score', value: gameState.score.toLocaleString(), bgColor: '#f59e0b', borderColor: '#d97706' },
          { label: 'Tokens Collected', value: gameState.tokensCollected.toString(), bgColor: '#10b981', borderColor: '#059669' },
          { label: 'Obstacles Hit', value: gameState.obstaclesHit.toString(), bgColor: '#ef4444', borderColor: '#dc2626' },
          { label: 'Difficulty Level', value: difficultyLevel.toString(), bgColor: '#8b5cf6', borderColor: '#7c3aed' }
        ]
        
        stats.forEach((stat, index) => {
          const cardWidth = 180
          const cardHeight = 80
          const cardsPerRow = 2
          const spacing = 20
          const row = Math.floor(index / cardsPerRow)
          const col = index % cardsPerRow
          const startX = (canvas.width - (cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing)) / 2
          const startY = 250
          
          const cardX = startX + col * (cardWidth + spacing)
          const cardY = startY + row * (cardHeight + spacing)
          
          // Draw card background with game-style gradient
          const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight)
          cardGradient.addColorStop(0, stat.bgColor)
          cardGradient.addColorStop(1, stat.borderColor)
          ctx.fillStyle = cardGradient
          
          // Draw rounded card
          ctx.beginPath()
          ctx.moveTo(cardX + 10, cardY)
          ctx.lineTo(cardX + cardWidth - 10, cardY)
          ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + 10)
          ctx.lineTo(cardX + cardWidth, cardY + cardHeight - 10)
          ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - 10, cardY + cardHeight)
          ctx.lineTo(cardX + 10, cardY + cardHeight)
          ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - 10)
          ctx.lineTo(cardX, cardY + 10)
          ctx.quadraticCurveTo(cardX, cardY, cardX + 10, cardY)
          ctx.closePath()
          ctx.fill()
          
          // Add border
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 3
          ctx.stroke()
          
          // Label
          ctx.fillStyle = '#000000'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(stat.label, cardX + cardWidth/2, cardY + 25)
          
          // Value
          ctx.fillStyle = '#000000'
          ctx.font = 'bold 24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(stat.value, cardX + cardWidth/2, cardY + 55)
                 })
        
        // Add call to action with website
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 28px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Can you beat my score? Play with $GUDTEK tokens!', canvas.width / 2, 480)
        
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 24px Arial'
        ctx.fillText('🎯 Play at: gudtek.club', canvas.width / 2, 520)
        
        // Convert to data URL
        resolve(canvas.toDataURL('image/png', 0.8))
      }
      
      logo.onerror = () => {
        // Fallback without logo - generate complete image
        // Add main title with shadow effect
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 64px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('VICTORY!', canvas.width / 2 + 3, 123) // Shadow
        ctx.fillStyle = '#ffffff'
        ctx.fillText('VICTORY!', canvas.width / 2, 120)
        
        // Add subtitle with shadow
        ctx.font = 'bold 32px Arial'
        ctx.fillStyle = '#000000'
        ctx.fillText('Token Dodge Game Stats', canvas.width / 2 + 2, 172) // Shadow
        ctx.fillStyle = '#ffffff'
        ctx.fillText('Token Dodge Game Stats', canvas.width / 2, 170)
        
        // Add GudTek text logo in top-left since SVG failed
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'left'
        ctx.fillText('GudTek', 50, 100)
        
        // Draw individual stat cards (fallback version)
        const stats = [
          { label: 'Final Score', value: gameState.score.toLocaleString(), bgColor: '#f59e0b', borderColor: '#d97706' },
          { label: 'Tokens Collected', value: gameState.tokensCollected.toString(), bgColor: '#10b981', borderColor: '#059669' },
          { label: 'Obstacles Hit', value: gameState.obstaclesHit.toString(), bgColor: '#ef4444', borderColor: '#dc2626' },
          { label: 'Difficulty Level', value: difficultyLevel.toString(), bgColor: '#8b5cf6', borderColor: '#7c3aed' }
        ]
        
        stats.forEach((stat, index) => {
          const cardWidth = 180
          const cardHeight = 80
          const cardsPerRow = 2
          const spacing = 20
          const row = Math.floor(index / cardsPerRow)
          const col = index % cardsPerRow
          const startX = (canvas.width - (cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing)) / 2
          const startY = 250
          
          const cardX = startX + col * (cardWidth + spacing)
          const cardY = startY + row * (cardHeight + spacing)
          
          // Draw card background with game-style gradient
          const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight)
          cardGradient.addColorStop(0, stat.bgColor)
          cardGradient.addColorStop(1, stat.borderColor)
          ctx.fillStyle = cardGradient
          
          // Draw rounded card
          ctx.beginPath()
          ctx.moveTo(cardX + 10, cardY)
          ctx.lineTo(cardX + cardWidth - 10, cardY)
          ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + 10)
          ctx.lineTo(cardX + cardWidth, cardY + cardHeight - 10)
          ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - 10, cardY + cardHeight)
          ctx.lineTo(cardX + 10, cardY + cardHeight)
          ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - 10)
          ctx.lineTo(cardX, cardY + 10)
          ctx.quadraticCurveTo(cardX, cardY, cardX + 10, cardY)
          ctx.closePath()
          ctx.fill()
          
          // Add border
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 3
          ctx.stroke()
          
          // Label
          ctx.fillStyle = '#000000'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(stat.label, cardX + cardWidth/2, cardY + 25)
          
          // Value
          ctx.fillStyle = '#000000'
          ctx.font = 'bold 24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(stat.value, cardX + cardWidth/2, cardY + 55)
        })
        
        // Add call to action with website
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 28px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Can you beat my score? Play with $GUDTEK tokens!', canvas.width / 2, 480)
        
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 24px Arial'
        ctx.fillText('🎯 Play at: gudtek.club', canvas.width / 2, 520)
        
        resolve(canvas.toDataURL('image/png', 0.8))
      }
      
      logo.src = '/Untitleddesign(5).svg'
    })
  }, [gameState.score, gameState.tokensCollected, gameState.obstaclesHit, difficultyLevel])

  // Share on Twitter with victory image
  const shareOnTwitter = async () => {
    try {
      // Generate victory stats image
      const imageDataUrl = await generateVictoryImage()
      
      // Create a temporary link to download the image
      const link = document.createElement('a')
      link.download = `gudtek-victory-${gameState.score}.png`
      link.href = imageDataUrl
      
      // Auto-download the image
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Show toast with instructions
      toast({
        title: "Victory Image Generated! 📸",
        description: "Image downloaded! Upload it to your tweet and use the text below.",
        duration: 8000,
      })
      
      // Create Twitter intent with text (user will manually upload the downloaded image)
      const text = `🎮 Just scored ${gameState.score} points in Token Dodge! 🪙

📊 My Stats:
• Tokens Collected: ${gameState.tokensCollected}
• Obstacles Hit: ${gameState.obstaclesHit}  
• Difficulty Reached: ${difficultyLevel}

Can you beat my score? Play now with $GUDTEK tokens! 🚀

🎯 Play at: gudtek.club

#TokenDodge #GudTek #Solana #GameFi`
      
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
      
      // Small delay to let toast show, then open Twitter
      setTimeout(() => {
        window.open(url, '_blank')
      }, 1500)
      
    } catch (error) {
      console.error('Error generating victory image:', error)
      
      // Fallback to text-only tweet
      const text = `🎮 Just scored ${gameState.score} points in Token Dodge! 🪙\n\nCan you beat my score? Play now with $GUDTEK tokens! 🚀\n\n🎯 Play at: gudtek.club\n\n#TokenDodge #GudTek #Solana #GameFi`
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
      window.open(url, '_blank')
    }
  }

  // Optimized collision detection with memoization
  const checkOverlap = useCallback((obj1: any, obj2: any, minDistance: number = 10) => {
    // Fast AABB collision detection - optimized for performance
    const dx = Math.abs((obj1.x + obj1.width * 0.5) - (obj2.x + obj2.width * 0.5))
    const dy = Math.abs((obj1.y + obj1.height * 0.5) - (obj2.y + obj2.height * 0.5))
    const minDistanceX = (obj1.width + obj2.width) * 0.5 + minDistance
    const minDistanceY = (obj1.height + obj2.height) * 0.5 + minDistance
    
    return dx < minDistanceX && dy < minDistanceY
  }, [])

  // Find safe positions for token placement
  const findSafeTokenPosition = useCallback((obstacles: typeof gameState.obstacles, tokens: typeof gameState.tokens) => {
    const attempts = 15 // Increased attempts
    const minObstacleDistance = 90 // Increased minimum distance from obstacles
    const minTokenDistance = 50 // Minimum distance from other tokens
    
    for (let i = 0; i < attempts; i++) {
      const y = 35 + Math.random() * (CANVAS_HEIGHT - 90) // Increased edge buffer
      const newToken = { x: CANVAS_WIDTH, y, width: 40, height: 40 }
      
      // Check if position is safe from all obstacles using precise collision detection
      const isSafeFromObstacles = obstacles.every(obstacle => {
        // Use the same collision detection as obstacles
        return !checkOverlap(newToken, obstacle, minObstacleDistance)
      })
      
      // Check if not too close to other tokens
      const isSafeFromTokens = tokens.every(token => {
        return !checkOverlap(newToken, token, minTokenDistance)
      })
      
      // Additional check for upcoming obstacles (those still far to the right)
      const safeFromUpcoming = obstacles.every(obstacle => {
        if (obstacle.x > CANVAS_WIDTH - 150) { // Upcoming obstacles
          const verticalDistance = Math.abs(obstacle.y + obstacle.height/2 - y - 20) // Token center (40/2 = 20)
          return verticalDistance > minObstacleDistance
        }
        return true
      })
      
      if (isSafeFromObstacles && isSafeFromTokens && safeFromUpcoming) {
        return y
      }
    }
    
    return null // No safe position found
  }, [checkOverlap])

  // Find safe position for obstacle placement
  const findSafeObstaclePosition = useCallback((
    x: number, 
    proposedY: number, 
    width: number, 
    height: number, 
    existingObstacles: typeof gameState.obstacles,
    existingTokens: typeof gameState.tokens
  ) => {
    const attempts = 20 // Increased attempts for better placement
    const minObstacleDistance = Math.max(50, width/2 + height/2) // Dynamic spacing based on obstacle size
    const minTokenDistance = 70 // Increased distance from tokens
    
    for (let attempt = 0; attempt < attempts; attempt++) {
      // Start with proposed position, then try variations with increasing randomness
      const randomFactor = attempt / attempts // 0 to 1
      const y = attempt === 0 
        ? proposedY 
        : proposedY + (Math.random() - 0.5) * 100 * randomFactor // Gradually increase search radius
      
      // Ensure Y stays in bounds
      const clampedY = Math.max(25, Math.min(y, CANVAS_HEIGHT - height - 25))
      
      const newObstacle = { x, y: clampedY, width, height }
      
      // Check against existing obstacles
      const overlapsObstacle = existingObstacles.some(obstacle => 
        checkOverlap(newObstacle, obstacle, minObstacleDistance)
      )
      
      // Check against existing tokens  
      const overlapsToken = existingTokens.some(token =>
        checkOverlap(newObstacle, token, minTokenDistance)
      )
      
      // Additional check: ensure obstacles aren't too close to screen edges
      const edgeBuffer = 30
      const withinBounds = clampedY >= edgeBuffer && clampedY <= CANVAS_HEIGHT - height - edgeBuffer
      
      if (!overlapsObstacle && !overlapsToken && withinBounds) {
        return clampedY
      }
    }
    
    return null // No safe position found
  }, [checkOverlap])

  // Create strategic obstacles with weighted types
  const createStrategicObstacle = useCallback((x: number, y: number, difficulty: number, forceType?: string) => {
    const types: ('rug' | 'fud' | 'bear' | 'paper' | 'scam')[] = ['rug', 'fud', 'bear', 'paper', 'scam']
    
    // Weight obstacle types based on difficulty and strategy
    let obstacleType: string
    if (forceType) {
      obstacleType = forceType
    } else {
      const weights = {
        'rug': difficulty > 5 ? 0.3 : 0.15,    // More dangerous at high difficulty
        'bear': difficulty > 3 ? 0.25 : 0.2,   // Market crash obstacles
        'fud': 0.2,                            // FUD spreaders
        'paper': difficulty < 5 ? 0.25 : 0.15, // Paper hands (easier early game)
        'scam': difficulty > 7 ? 0.2 : 0.1     // Scams become more common
      }
      
      const rand = Math.random()
      let cumulative = 0
      obstacleType = 'fud' // fallback
      
      for (const [type, weight] of Object.entries(weights)) {
        cumulative += weight
        if (rand <= cumulative) {
          obstacleType = type
          break
        }
      }
    }
    
    // Size varies by type and difficulty
    const baseSizes = {
      'rug': { width: 65, height: 65 },      // Large and dangerous
      'bear': { width: 70, height: 55 },     // Wide but shorter
      'fud': { width: 50, height: 50 },      // Medium size
      'paper': { width: 40, height: 55 },    // Narrow but tall
      'scam': { width: 55, height: 40 }      // Wide but short
    }
    
    const size = baseSizes[obstacleType as keyof typeof baseSizes] || { width: 35, height: 35 }
    
    // Adjust size based on difficulty (but keep it reasonable)
    const sizeMultiplier = 1 + (difficulty - 1) * 0.05 // 5% larger per difficulty level
    
    return {
      id: Date.now() + Math.random(),
      x: Math.max(0, Math.min(x, CANVAS_WIDTH)),
      y: Math.max(10, Math.min(y, CANVAS_HEIGHT - size.height - 10)),
      width: Math.min(size.width * sizeMultiplier, 90), // Cap maximum size
      height: Math.min(size.height * sizeMultiplier, 90),
      type: obstacleType as 'rug' | 'fud' | 'bear' | 'paper' | 'scam'
    }
  }, [])

  // Memory-optimized obstacle spawning with object pooling concepts
  const spawnObstacles = useCallback((currentTime: number, gameState: GameState) => {
    const timeSinceStart = currentTime - gameState.gameStartTime
    const newDifficultyLevel = Math.min(10, Math.floor(timeSinceStart / 15000) + 1) // Increase difficulty every 15 seconds
    
    if (newDifficultyLevel !== difficultyLevel) {
      setDifficultyLevel(newDifficultyLevel)
    }

    // Dynamic spawn rates based on difficulty with performance consideration
    const baseObstacleChance = 0.008 + (newDifficultyLevel * 0.003) // 0.8% to 3.8%
    const baseTokenChance = 0.015 + (newDifficultyLevel * 0.002) // 1.5% to 3.5%
    
    // Performance limiting: don't spawn too many objects at once
    const maxObstacles = 8 + newDifficultyLevel // Scale with difficulty but cap performance
    const maxTokens = 6 + Math.floor(newDifficultyLevel / 2)
    
    // Pattern-based obstacle generation
    const timeSinceLastObstacle = currentTime - lastObstacleTime
    const timeSinceLastToken = currentTime - lastTokenTime
    
    const newObstacles: typeof gameState.obstacles = [...gameState.obstacles]
    const newTokens: typeof gameState.tokens = [...gameState.tokens]
    
    // Strategic obstacle patterns with performance guards
    switch (obstaclePattern) {
      case 'wave':
        // Create wave patterns - obstacles move in sine wave formation
        if (newObstacles.length < maxObstacles && 
            timeSinceLastObstacle > 1000 && 
            Math.random() < baseObstacleChance * 2) {
          const waveHeight = CANVAS_HEIGHT * 0.3
          const centerY = CANVAS_HEIGHT / 2
          const waveOffset = Math.sin(patternProgress * 0.3) * waveHeight
          const proposedY = centerY + waveOffset
          
          const obstacle = createStrategicObstacle(CANVAS_WIDTH, proposedY, newDifficultyLevel)
          const safeY = findSafeObstaclePosition(
            CANVAS_WIDTH, 
            proposedY, 
            obstacle.width, 
            obstacle.height, 
            newObstacles,
            newTokens
          )
          
          if (safeY !== null) {
            newObstacles.push({ ...obstacle, y: safeY })
            setLastObstacleTime(currentTime)
            setPatternProgress(prev => prev + 1)
          }
        }
        break
        
      case 'corridor':
        // Create corridor patterns - leave safe paths
        if (newObstacles.length < maxObstacles - 1 && // Need room for 2 obstacles
            timeSinceLastObstacle > 800 && 
            Math.random() < baseObstacleChance * 1.5) {
          const corridorWidth = 80 + (20 * (10 - newDifficultyLevel)) // Narrower corridors at higher difficulty
          const corridorY = 60 + Math.random() * (CANVAS_HEIGHT - corridorWidth - 120)
          
          // Try to place top obstacle
          const topObstacle = createStrategicObstacle(CANVAS_WIDTH, 0, newDifficultyLevel)
          const topSafeY = findSafeObstaclePosition(
            CANVAS_WIDTH,
            Math.random() * corridorY,
            topObstacle.width,
            topObstacle.height,
            newObstacles,
            newTokens
          )
          
          // Try to place bottom obstacle
          const bottomObstacle = createStrategicObstacle(CANVAS_WIDTH, 0, newDifficultyLevel)
          const bottomSafeY = findSafeObstaclePosition(
            CANVAS_WIDTH,
            corridorY + corridorWidth + Math.random() * (CANVAS_HEIGHT - corridorY - corridorWidth),
            bottomObstacle.width,
            bottomObstacle.height,
            newObstacles,
            newTokens
          )
          
          // Only add obstacles if both positions are safe
          if (topSafeY !== null && bottomSafeY !== null) {
            newObstacles.push({ ...topObstacle, y: topSafeY })
            newObstacles.push({ ...bottomObstacle, y: bottomSafeY })
            setLastObstacleTime(currentTime)
          }
        }
        break
        
      case 'cluster':
        // Create clustered obstacles with safe zones
        if (newObstacles.length < maxObstacles - 2 && // Need room for cluster
            timeSinceLastObstacle > 1200 && 
            Math.random() < baseObstacleChance * 1.2) {
          const clusterY = 40 + Math.random() * (CANVAS_HEIGHT - 120)
          const clusterSize = 2 + Math.floor(newDifficultyLevel / 3)
          let placedInCluster = 0
          
          for (let i = 0; i < clusterSize && placedInCluster < 3; i++) {
            const obstacle = createStrategicObstacle(
              CANVAS_WIDTH + (i * 60), // Spread horizontally
              clusterY, 
              newDifficultyLevel,
              i === 0 ? 'rug' : undefined // First obstacle is always dangerous
            )
            
            const safeY = findSafeObstaclePosition(
              obstacle.x,
              clusterY + (Math.random() - 0.5) * 60, // Small vertical variation
              obstacle.width,
              obstacle.height,
              newObstacles,
              newTokens
            )
            
            if (safeY !== null) {
              newObstacles.push({ ...obstacle, y: safeY })
              placedInCluster++
            }
          }
          
          if (placedInCluster > 0) {
            setLastObstacleTime(currentTime)
          }
        }
        break
        
      default: // random
        if (newObstacles.length < maxObstacles && 
            Math.random() < baseObstacleChance) {
          // Ensure minimum spacing between obstacles
          if (timeSinceLastObstacle > 500) {
            const obstacle = createStrategicObstacle(CANVAS_WIDTH, 0, newDifficultyLevel)
            const safeY = findSafeObstaclePosition(
              CANVAS_WIDTH,
              Math.random() * (CANVAS_HEIGHT - 60) + 20, // Keep away from edges
              obstacle.width,
              obstacle.height,
              newObstacles,
              newTokens
            )
            
            if (safeY !== null) {
              newObstacles.push({ ...obstacle, y: safeY })
              setLastObstacleTime(currentTime)
            }
          }
        }
    }
    
    // Strategic token placement with improved collision detection and performance guards
    if (newTokens.length < maxTokens && 
        Math.random() < baseTokenChance && 
        timeSinceLastToken > 300) {
      // Place tokens in strategic positions
      const safeY = findSafeTokenPosition(newObstacles, newTokens)
      if (safeY !== null) {
        const newToken = {
          id: Date.now() + Math.random(), // Ensure unique IDs
          x: CANVAS_WIDTH,
          y: safeY,
          width: 40,
          height: 40
        }
        
        // Triple-check the token doesn't overlap with any obstacles (belt and suspenders approach)
        const tokenOverlaps = newObstacles.some(obstacle =>
          checkOverlap(newToken, obstacle, 60) // Extra buffer for safety
        )
        
        // Also check against tokens already in newTokens array
        const tokenOverlapsOthers = newTokens.some(token =>
          checkOverlap(newToken, token, 40)
        )
        
        if (!tokenOverlaps && !tokenOverlapsOthers) {
          newTokens.push(newToken)
          setLastTokenTime(currentTime)
        }
      }
    }
    
    // Change patterns periodically
    if (timeSinceStart > 0 && timeSinceStart % 20000 < 100) { // Every 20 seconds
      const patterns: typeof obstaclePattern[] = ['random', 'wave', 'corridor', 'cluster']
      setObstaclePattern(patterns[Math.floor(Math.random() * patterns.length)])
      setPatternProgress(0)
    }
    
    return { obstacles: newObstacles, tokens: newTokens }
  }, [difficultyLevel, lastObstacleTime, lastTokenTime, obstaclePattern, patternProgress, createStrategicObstacle, findSafeObstaclePosition, findSafeTokenPosition, checkOverlap])

  if (!mounted) return null

  const canPlay = connected && publicKey && walletInfo.gudtekBalance >= MIN_GUDTEK_BALANCE

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Navbar - matching main site */}
      <nav className="fixed left-0 right-0 top-0 bg-white/10 backdrop-filter backdrop-blur-lg z-50 shadow-lg border-b-2 border-orange-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Logo/Site Title */}
              <Link href="/" className="flex-shrink-0 flex items-center">
                <img
                  src="/images/gudtek-logo.png"
                  alt="Gud Tek Logo"
                  className="h-8 w-8 rounded-full mr-2"
                  width={32}
                  height={32}
                />
                <span className="text-gray-900 font-black text-xl tracking-tight">GUD TEK</span>
              </Link>
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      item.name === 'Game' 
                        ? 'text-gray-900 bg-white/20' 
                        : 'text-gray-800 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            {/* Mobile Nav Button */}
            <div className="-mr-2 flex md:hidden">
              <Button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 bg-transparent hover:bg-transparent"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isNavOpen ? (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <X className="block h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${isNavOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/20 backdrop-filter backdrop-blur-lg border-t border-orange-400/30">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  item.name === 'Game' 
                    ? 'text-gray-900 bg-white/20' 
                    : 'text-gray-800 hover:text-gray-900'
                }`}
                onClick={() => setIsNavOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border-2 border-gray-900/20 rounded-full px-6 py-3 mb-6 shadow-xl">
              <Target className="w-6 h-6 text-gray-900" />
              <span className="text-lg font-black text-gray-900">TOKEN DODGE GAME</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
              Token Dodge
            </h1>
            <p className="text-xl font-bold text-gray-800 max-w-2xl mx-auto">
              Catch $GUDTEK tokens, avoid the scams! 🚀
            </p>
          </motion.div>

          {/* Wallet Connection Section - like memes page */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white/20 backdrop-filter backdrop-blur-lg border-2 border-gray-900/20 rounded-xl p-6 max-w-2xl mx-auto shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  {connected && publicKey ? (
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-1">Your $GUDTEK Balance</p>
                      <p className="text-2xl font-black text-gray-900">
                        {walletLoading ? 'Loading...' : formatTokenBalance(walletInfo.gudtekBalance)}
                      </p>
                      <p className="text-sm text-gray-600">
                        SOL: {walletLoading ? '...' : formatSolBalance(walletInfo.solBalance)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-bold text-gray-900 mb-1">Connect Your Wallet</p>
                      <p className="text-sm text-gray-700">To play the Token Dodge game</p>
                    </div>
                  )}
                </div>
                <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 !border-2 !border-gray-900 !rounded-lg !font-bold !shadow-lg transform hover:scale-105 transition-all duration-200" />
              </div>
            </div>
          </motion.div>

          {/* Wallet Status Alert - like memes page */}
          {connected && publicKey && !walletLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8 max-w-2xl mx-auto"
            >
              {canPlay ? (
                <Alert className="border-2 border-green-400 bg-green-100/80 backdrop-filter backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800 font-bold">
                    🎉 Perfect! You can play Token Dodge!
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-2 border-red-400 bg-red-100/80 backdrop-filter backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-bold">
                    ❌ Need at least {MIN_GUDTEK_BALANCE.toLocaleString()} $GUDTEK tokens to play.
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}

          {/* Dynamic Contest Banner */}
          <Card className={`mb-8 border-2 border-yellow-400 shadow-xl ${
            contestInfo.isFirst24Hours 
              ? 'bg-gradient-to-r from-red-600 to-orange-600' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600'
          }`}>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6 items-center text-white">
                                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">
                      {contestInfo.isFirst24Hours ? '🔥 24-Hour Launch Contest!' : 'Weekly $GUDTEK Airdrops'}
                    </div>
                    <div className="text-sm opacity-90">
                      {contestInfo.isFirst24Hours 
                        ? 'Get ready for exclusive launch rewards!' 
                        : 'Every Monday we select winners'
                      }
                    </div>
                  </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/15 rounded-lg p-3 backdrop-blur">
                    <div className="text-lg font-bold text-yellow-300">#1 Player</div>
                    <div className="text-sm">Guaranteed Winner</div>
                  </div>
                  <div className="bg-white/15 rounded-lg p-3 backdrop-blur">
                    <div className="text-lg font-bold text-green-300">Top 10</div>
                    <div className="text-sm">4 Random Winners</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-300 mb-1">
                    {contestInfo.isFirst24Hours ? 'Launch Rewards!' : 'Win Real $GUDTEK'}
                  </div>
                  <div className="text-sm opacity-90">
                    {contestInfo.isFirst24Hours 
                      ? 'Extra prizes for first 24h!' 
                      : `Next airdrop: ${contestInfo.nextAirdropDate}`
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Global Leaderboard - Prominent Position */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20 mb-6">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center justify-center gap-3 text-2xl">
                <Trophy className="w-8 h-8" />
                🏆 Global Leaderboard - Top 10 Champions
              </CardTitle>
              <p className="text-center text-gray-700 mt-1">
                {contestInfo.isFirst24Hours 
                  ? '24-hour contest winners selected from top performers' 
                  : 'Weekly winners selected from these top performers'
                }
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-md transition-all duration-200 hover:scale-105 ${
                      index < 3 ? 'bg-gradient-to-br from-yellow-400/30 to-orange-400/30 border-2 border-yellow-500/50' : 'bg-white/15 border border-white/30'
                    }`}
                  >
                    <div className="text-center mb-2">
                      {index < 3 ? (
                        <div className="relative mb-2">
                          <Crown className={`w-8 h-8 mx-auto ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            'text-orange-500'
                          }`} />
                          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-500/30 rounded-full flex items-center justify-center text-gray-600 font-bold mx-auto mb-2">
                          {index + 1}
                        </div>
                      )}
                      <div className="font-bold text-sm text-gray-900 truncate">{entry.username}</div>
                      <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                        {entry.isVerified && (
                          <Shield className="w-3 h-3 text-green-600" />
                        )}
                        🎮 {entry.totalGames}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-black text-lg text-gray-900">{entry.totalScore.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 font-medium">Total Score</div>
                      <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                        🏆 <span className="font-mono">{entry.highScore.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {leaderboard.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No scores yet. Be the first to play!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Game Area */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Game Canvas */}
            <div className="lg:col-span-3">
              <Card className="backdrop-blur-md bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-gray-900">
                    <span className="flex items-center gap-2">
                      <Target className="w-6 h-6" />
                      Game Area
                    </span>
                    {connected && canPlay && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-800">
                        <Shield className="w-4 h-4 mr-1" />
                        Verified Holder
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Game Stats Display - Always visible at the top */}
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"
                    >
                      {/* Score */}
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 text-center shadow-lg border-2 border-gray-900/20">
                        <div className="text-gray-900 text-sm font-bold mb-1">SCORE</div>
                        <div className="text-2xl md:text-3xl font-black text-gray-900">{gameState.score}</div>
                      </div>
                      
                      {/* Tokens Collected */}
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg p-4 text-center shadow-lg border-2 border-gray-900/20">
                        <div className="text-gray-900 text-sm font-bold mb-1">TOKENS</div>
                        <div className="text-2xl md:text-3xl font-black text-gray-900">
                          {gameState.tokensCollected}
                        </div>
                      </div>
                      
                      {/* Lives */}
                      <div className="bg-gradient-to-r from-red-400 to-pink-500 rounded-lg p-4 text-center shadow-lg border-2 border-gray-900/20">
                        <div className="text-gray-900 text-sm font-bold mb-1">LIVES</div>
                        <div className="text-2xl md:text-3xl font-black text-gray-900">
                          {gameState.lives}
                        </div>
                      </div>
                      
                      {/* Time */}
                      <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg p-4 text-center shadow-lg border-2 border-gray-900/20">
                        <div className="text-gray-900 text-sm font-bold mb-1">TIME</div>
                        <div className="text-2xl md:text-3xl font-black text-gray-900">
                          {gameState.gameRunning ? Math.floor((Date.now() - gameState.gameStartTime) / 1000) : 0}s
                        </div>
                      </div>
                    </motion.div>
                    


                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        width={canvasDimensions.width}
                        height={canvasDimensions.height}
                        className="w-full border-2 border-gray-900/20 rounded-lg bg-gradient-to-br from-orange-300 to-yellow-300"
                      />
                    </div>
                    
                    {/* Game Over Overlay - Integrated within the game section */}
                    {gameOver && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 20,
                          staggerChildren: 0.1
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg"
                      >
                        <div className="max-w-2xl w-full mx-4 space-y-6">
                          {/* Game Over Header */}
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl p-6 shadow-2xl border-4 border-yellow-400 text-center"
                          >
                            <motion.h3 
                              initial={{ y: -20 }}
                              animate={{ y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="text-4xl md:text-5xl font-black text-white mb-2"
                            >
                              GAME OVER!
                            </motion.h3>
                            <motion.p 
                              initial={{ y: 20 }}
                              animate={{ y: 0 }}
                              transition={{ delay: 0.6 }}
                              className="text-white/90 text-xl font-bold"
                            >
                              Epic run! Check your stats below
                            </motion.p>
                          </motion.div>

                          {/* Final Stats Grid */}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                          >
                            {/* Final Score */}
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 1.0 }}
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 text-center shadow-lg border-2 border-gray-900"
                            >
                              <div className="text-gray-900 text-sm font-bold mb-2">FINAL SCORE</div>
                              <div className="text-3xl md:text-4xl font-black text-gray-900">{gameState.score}</div>
                              <div className="text-xs text-gray-700 mt-1">Points Earned</div>
                            </motion.div>
                            
                            {/* Tokens Collected */}
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 1.1 }}
                              className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg p-4 text-center shadow-lg border-2 border-gray-900"
                            >
                              <div className="text-gray-900 text-sm font-bold mb-2">TOKENS</div>
                              <div className="text-3xl md:text-4xl font-black text-gray-900">
                                {gameState.tokensCollected}
                              </div>
                              <div className="text-xs text-gray-700 mt-1">Collected</div>
                            </motion.div>
                            
                            {/* Obstacles Hit */}
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 1.2 }}
                              className="bg-gradient-to-r from-red-400 to-pink-500 rounded-lg p-4 text-center shadow-lg border-2 border-gray-900"
                            >
                              <div className="text-gray-900 text-sm font-bold mb-2">HITS</div>
                              <div className="text-3xl md:text-4xl font-black text-gray-900">
                                {gameState.obstaclesHit}
                              </div>
                              <div className="text-xs text-gray-700 mt-1">Obstacles Hit</div>
                            </motion.div>
                            
                            {/* Survival Time */}
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 1.3 }}
                              className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg p-4 text-center shadow-lg border-2 border-gray-900"
                            >
                              <div className="text-gray-900 text-sm font-bold mb-2">SURVIVAL</div>
                              <div className="text-3xl md:text-4xl font-black text-gray-900">
                                {Math.floor((Date.now() - gameState.gameStartTime) / 1000)}s
                              </div>
                              <div className="text-xs text-gray-700 mt-1">Time Played</div>
                            </motion.div>
                          </motion.div>

                          {/* Performance Rating */}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4 }}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 shadow-2xl border-4 border-yellow-400"
                          >
                            <h4 className="text-xl font-black text-white mb-3 text-center">PERFORMANCE RATING</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                              <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.6 }}
                                className="text-center"
                              >
                                <div className="text-3xl font-bold mb-1">{gameState.tokensCollected > 10 ? '🔥' : gameState.tokensCollected > 5 ? '👍' : '🎯'}</div>
                                <div className="text-sm font-bold">Token Collection</div>
                                <div className="text-xs opacity-75">
                                  {gameState.tokensCollected > 10 ? 'Excellent!' : gameState.tokensCollected > 5 ? 'Good Job!' : 'Keep Trying!'}
                                </div>
                              </motion.div>
                              <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.7 }}
                                className="text-center"
                              >
                                <div className="text-3xl font-bold mb-1">{gameState.obstaclesHit < 2 ? '🛡️' : gameState.obstaclesHit < 4 ? '⚠️' : '💀'}</div>
                                <div className="text-sm font-bold">Dodge Skills</div>
                                <div className="text-xs opacity-75">
                                  {gameState.obstaclesHit < 2 ? 'Master!' : gameState.obstaclesHit < 4 ? 'Not Bad' : 'Practice More'}
                                </div>
                              </motion.div>
                              <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.8 }}
                                className="text-center"
                              >
                                <div className="text-3xl font-bold mb-1">{gameState.score > 100 ? '💎' : gameState.score > 50 ? '🥇' : '🏅'}</div>
                                <div className="text-sm font-bold">Overall Score</div>
                                <div className="text-xs opacity-75">
                                  {gameState.score > 100 ? 'Legendary!' : gameState.score > 50 ? 'Great!' : 'Getting There'}
                                </div>
                              </motion.div>
                            </div>
                          </motion.div>

                          {/* Action Buttons */}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.9 }}
                            className="flex flex-wrap gap-3 justify-center"
                          >
                            <Button 
                              onClick={startGame} 
                              size="lg" 
                              className="bg-green-500 hover:bg-green-600 text-white border-4 border-yellow-400 font-black shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                              <RotateCcw className="w-5 h-5 mr-2" />
                              Play Again
                            </Button>
                            <Button 
                              onClick={submitScore} 
                              disabled={isSubmitting} 
                              size="lg" 
                              className="bg-blue-500 hover:bg-blue-600 text-white border-4 border-yellow-400 font-black shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                              <Trophy className="w-5 h-5 mr-2" />
                              {isSubmitting ? 'Submitting...' : 'Submit Score'}
                            </Button>
                            <Button 
                              onClick={shareOnTwitter} 
                              size="lg" 
                              className="bg-black hover:bg-gray-800 text-white border-4 border-yellow-400 font-black shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                              <svg className="w-5 h-5 mr-2" viewBox="0 0 1200 1227" fill="currentColor">
                                <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"/>
                              </svg>
                              Share Victory
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Game Controls Section */}
                    <div className="space-y-4">
                      {/* Main Game Button */}
                      <div className="flex justify-center">
                        {!gameState.gameRunning && !gameOver && (
                          <Button 
                            onClick={startGame} 
                            size="lg" 
                            className="bg-green-500 hover:bg-green-600 text-white border-2 border-gray-900 font-bold"
                            disabled={!canPlay}
                          >
                            <Play className="w-5 h-5 mr-2" />
                            {canPlay ? 'Start Game' : 'Connect Wallet to Play'}
                          </Button>
                        )}
                        
                        {gameState.gameRunning && !gameOver && (
                          <div className="text-center">
                            <Button 
                              onClick={() => {
                                setGameState(prev => ({ ...prev, gameRunning: false }))
                                setGameOver(true)
                              }}
                              size="sm" 
                              variant="outline"
                              className="border-2 border-gray-900"
                            >
                              Stop Game
                            </Button>
                          </div>
                        )}
                      </div>
                      
                                             {/* Sound Toggle Button - Separate Row */}
                       <div className="flex justify-center gap-2">
                         <Button
                           onClick={() => {
                             setSoundEnabled(!soundEnabled)
                             // Test sound when enabling
                             if (!soundEnabled && soundManagerRef.current) {
                               setTimeout(() => {
                                 try {
                                   soundManagerRef.current?.play('tokenCollect')
                                   console.log('🔊 Test sound played on enable')
                                 } catch (error) {
                                   console.warn('⚠️ Test sound failed:', error)
                                 }
                               }, 100)
                             }
                           }}
                           size="sm"
                           variant="outline"
                           className="border-2 border-gray-900 bg-white/20 hover:bg-white/30 text-gray-800 font-medium"
                           title={soundEnabled ? 'Disable Sound Effects' : 'Enable Sound Effects'}
                         >
                           {soundEnabled ? (
                             <>
                               <Volume2 className="w-4 h-4 mr-2" />
                               Sound ON
                             </>
                           ) : (
                             <>
                               <VolumeX className="w-4 h-4 mr-2" />
                               Sound OFF
                             </>
                           )}
                         </Button>
                         
                         {/* Audio Status Indicator */}
                         {soundEnabled && (
                           <div className="flex items-center text-xs text-gray-600">
                             {audioContext === 'locked' && '🔒 Click to unlock'}
                             {audioContext === 'unlocked' && '✅ Ready'}
                             {audioContext === 'unsupported' && '❌ Unsupported'}
                           </div>
                         )}
                       </div>
                    </div>
                    
                    <div className="text-center text-gray-800 text-sm">
                      Use Arrow Keys or WASD to move • Catch tokens • Avoid obstacles
                    </div>
                    
                    {/* Mobile Touch Controls */}
                    <div className="md:hidden mt-4">
                      <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
                        <div></div>
                        <Button
                          onTouchStart={() => handleMobileMove('up')}
                          className="h-12 bg-orange-500/20 border-2 border-gray-900 hover:bg-orange-500/40"
                          disabled={!gameState.gameRunning}
                        >
                          ⬆️
                        </Button>
                        <div></div>
                        <Button
                          onTouchStart={() => handleMobileMove('left')}
                          className="h-12 bg-orange-500/20 border-2 border-gray-900 hover:bg-orange-500/40"
                          disabled={!gameState.gameRunning}
                        >
                          ⬅️
                        </Button>
                        <div></div>
                        <Button
                          onTouchStart={() => handleMobileMove('right')}
                          className="h-12 bg-orange-500/20 border-2 border-gray-900 hover:bg-orange-500/40"
                          disabled={!gameState.gameRunning}
                        >
                          ➡️
                        </Button>
                        <div></div>
                        <Button
                          onTouchStart={() => handleMobileMove('down')}
                          className="h-12 bg-orange-500/20 border-2 border-gray-900 hover:bg-orange-500/40"
                          disabled={!gameState.gameRunning}
                        >
                          ⬇️
                        </Button>
                        <div></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 text-center">Tap buttons to move on mobile</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Game Info */}
              <Card className="backdrop-blur-md bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Quick Start
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-gray-900 text-sm">
                  <div>
                    <p className="font-bold mb-1">Objective</p>
                    <p>Catch $GUDTEK tokens, avoid obstacles</p>
                  </div>
                  <div>
                    <p className="font-bold mb-1">Controls</p>
                    <p>Arrow keys or WASD to move</p>
                  </div>
                  <div>
                    <p className="font-bold mb-1">Scoring</p>
                    <p>10 points per token, 3 lives total</p>
                  </div>
                  <div>
                    <p className="font-bold mb-1">Audio</p>
                    <p>Sound effects enhance gameplay experience</p>
                  </div>
                </CardContent>
              </Card>

              {/* User Stats */}
              {connected && publicKey && (
                <Card className="backdrop-blur-md bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Your Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-gray-900">
                    <div className="flex justify-between">
                      <span>Balance:</span>
                      <span className="font-mono">{walletLoading ? '...' : formatTokenBalance(walletInfo.gudtekBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Score:</span>
                      <span className="font-mono">{highScore}</span>
                    </div>
                    {userRank && (
                      <div className="flex justify-between">
                        <span>Total Score:</span>
                        <span className="font-mono">{userRank.totalScore || 0}</span>
                      </div>
                    )}
                    {userRank && (
                      <div className="flex justify-between">
                        <span>Rank:</span>
                        <span className="font-mono">#{userRank.rank}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Wallet:</span>
                      <span className="font-mono text-xs">{publicKey.toString().slice(0, 8)}...</span>
                    </div>
                  </CardContent>
                </Card>
              )}




            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 