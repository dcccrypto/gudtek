'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Download, Share2, Shuffle, Repeat, Headphones, Waves, BarChart3, Activity, Radio, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/Navbar'
import Image from 'next/image'

interface Track {
  id: number
  title: string
  filename: string
  cover: string
  duration?: string
  description?: string
}

const tracks: Track[] = [
  {
    id: 1,
    title: "Anthem",
    filename: "Anthem.mp3",
    cover: "/Gudmusic/photo_2025-06-13_19-39-53.jpg",
    duration: "2:48",
    description: "The official GUD TEK anthem that started it all"
  },
  {
    id: 2,
    title: "Bags on the Way",
    filename: "Bags on the way.mp3",
    cover: "/Gudmusic/bagsontheway.jpg",
    duration: "2:52",
    description: "When the bags are coming and nothing can stop them"
  },
  {
    id: 3,
    title: "Chart Splat",
    filename: "Chart Splat.mp3",
    cover: "/Gudmusic/chartsplat.jpg",
    duration: "3:24",
    description: "Making charts go vertical since day one"
  },
  {
    id: 4,
    title: "Gudtek Boyz",
    filename: "gudtek boyz.mp3",
    cover: "/Gudmusic/gudtekboyz.jpg",
    duration: "3:18",
    description: "For the real ones who know what GUD TEK is about"
  },
  {
    id: 5,
    title: "Tek is Gud",
    filename: "Tek is Gud.mp3",
    cover: "/Gudmusic/tekisgud.jpg",
    duration: "2:43",
    description: "Simple truth: TEK IS GUD"
  }
]

export default function GudMusicPage() {
  const [currentTrack, setCurrentTrack] = useState<Track>(tracks[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([75])
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(75)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(true)
  const [currentUrl, setCurrentUrl] = useState('')
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    // Set current URL on client side to avoid SSR issues
    setCurrentUrl(window.location.origin)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setAudioTime = () => {
      if (!isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime)
      }
    }

    const setAudioDuration = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      handleTrackEnd()
    }
    const handleLoadStart = () => {
      setCurrentTime(0)
      setDuration(0)
    }
    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }
    const handleCanPlay = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }
    const handleDurationChange = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }
    const handleError = (e: Event) => {
      console.error('Audio error:', e)
      setIsPlaying(false)
    }

    // Add all necessary event listeners
    audio.addEventListener('timeupdate', setAudioTime)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('error', handleError)

    // Force duration check if audio is already loaded
    if (!isNaN(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration)
    }

    return () => {
      audio.removeEventListener('timeupdate', setAudioTime)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('error', handleError)
    }
  }, [currentTrack])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100
    }
  }, [volume, isMuted])

  useEffect(() => {
    // Setup Web Audio API when playing starts
    if (isPlaying) {
      // Small delay to ensure audio is playing before setting up analyzer
      setTimeout(() => {
        if (!audioContextRef.current) {
          setupAudioAnalyser()
        }
        startVisualization()
      }, 500) // Increased delay to let audio start first
    } else {
      stopVisualization()
    }

    return () => {
      stopVisualization()
    }
  }, [isPlaying])

  const setupAudioAnalyser = () => {
    if (!audioRef.current || audioContextRef.current) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Resume audio context if it's suspended (required by modern browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      audioContextRef.current = audioContext

      const source = audioContext.createMediaElementSource(audioRef.current)
      const analyser = audioContext.createAnalyser()
      
      // Crypto chart optimized settings for smoother, more stable visualization
      analyser.fftSize = 512  // Balanced resolution for crypto-style chart
      analyser.smoothingTimeConstant = 0.8  // Much smoother, less jittery like real charts
      analyser.minDecibels = -90
      analyser.maxDecibels = -20

      source.connect(analyser)
      analyser.connect(audioContext.destination)

      sourceRef.current = source
      analyserRef.current = analyser
    } catch (error) {
      console.error('Error setting up audio analyser:', error)
    }
  }

  const startVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!analyserRef.current || !isPlaying) return

      analyserRef.current.getByteFrequencyData(dataArray)

      // Clear canvas with professional dark background
      canvasCtx.fillStyle = '#0c0c0f'
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw professional trading chart grid
      drawProfessionalTradingGrid(canvasCtx, canvas)

      // Draw enhanced crypto-style chart
      drawEnhancedCryptoChart(canvasCtx, canvas, dataArray)

      // Add professional chart labels and indicators
      drawChartLabels(canvasCtx, canvas)

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
  }

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const drawProfessionalTradingGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Major grid lines
    ctx.strokeStyle = '#1a1a23'
    ctx.lineWidth = 1

    // Horizontal grid lines (price levels)
    for (let i = 0; i <= 8; i++) {
      const y = (canvas.height / 8) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Vertical grid lines (time intervals)
    for (let i = 0; i <= 16; i++) {
      const x = (canvas.width / 16) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Minor grid lines for more detail
    ctx.strokeStyle = '#13131a'
    ctx.lineWidth = 0.5

    // Minor horizontal lines
    for (let i = 0; i <= 16; i++) {
      const y = (canvas.height / 16) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

    const drawEnhancedCryptoChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
    // Crypto-style chart with fewer, wider candlesticks like real trading platforms
    const numBars = Math.min(dataArray.length, 60) // Fewer bars for more crypto-like appearance
    const barWidth = (canvas.width / numBars) * 0.8 // Slightly narrower bars with gaps
    const barSpacing = canvas.width / numBars
    let x = barSpacing * 0.1 // Start with small offset

    // Process data for realistic candlestick visualization (reversed for proper crypto chart flow)
    for (let i = 0; i < numBars; i += 1) {
      // Reverse the data flow so newer/active data appears on the right like real crypto charts
      const reverseIndex = numBars - 1 - i
      const currentIndex = Math.floor((reverseIndex / numBars) * dataArray.length)
      const nextIndex = Math.floor(((reverseIndex + 1) / numBars) * dataArray.length)
      
      const currentValue = dataArray[currentIndex] || 0
      const nextValue = dataArray[nextIndex] || currentValue
      
      // Enhanced normalization to prevent flat areas and ensure more dynamic movement
      const baseValue = 0.3 // Higher baseline to avoid flat areas
      const amplification = 0.6 // Amplify the range
      const normalizedCurrent = (currentValue / 255) * amplification + baseValue
      const normalizedNext = (nextValue / 255) * amplification + baseValue
      
      // Add some baseline activity for low-frequency areas to prevent flatness
      const activityBoost = Math.sin(i * 0.1) * 0.05 // Small sine wave for natural variation
      const boostedCurrent = Math.min(normalizedCurrent + activityBoost, 0.95)
      const boostedNext = Math.min(normalizedNext + activityBoost, 0.95)
      
      // Calculate realistic candlestick properties with enhanced volatility for visual interest
      const open = boostedCurrent
      const close = boostedNext
      const volatility = Math.max(Math.abs(close - open) * 0.4, 0.02) // Minimum volatility to prevent flatness
      const high = Math.max(open, close) + volatility
      const low = Math.min(open, close) - volatility
      
      // Ensure values stay within realistic bounds
      const clampedHigh = Math.min(high, 0.95)
      const clampedLow = Math.max(low, 0.05)
      
      // Calculate positions with more realistic proportions
      const chartHeight = canvas.height * 0.7 // Use 70% of canvas height
      const chartBottom = canvas.height * 0.85 // Bottom margin
      
      const bodyHeight = Math.abs(close - open) * chartHeight
      const bodyTop = chartBottom - (Math.max(open, close) * chartHeight)
      const wickTop = chartBottom - (clampedHigh * chartHeight)
      const wickBottom = chartBottom - (clampedLow * chartHeight)
      
      const isGreen = close >= open
      
      // Draw candlestick wick with professional styling
      ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350' // More muted crypto colors
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x + barWidth/2, wickTop)
      ctx.lineTo(x + barWidth/2, wickBottom)
      ctx.stroke()
      
      // Draw candlestick body with realistic crypto colors
      if (isGreen) {
        ctx.fillStyle = '#26a69a' // Binance-style green
        ctx.strokeStyle = '#1e8e3e'
      } else {
        ctx.fillStyle = '#ef5350' // Binance-style red
        ctx.strokeStyle = '#d32f2f'
      }
      
      // Draw the candlestick body
      const minBodyHeight = Math.max(bodyHeight, 3) // Slightly larger minimum height
      ctx.fillRect(x + 2, bodyTop, barWidth - 4, minBodyHeight)
      ctx.strokeRect(x + 2, bodyTop, barWidth - 4, minBodyHeight)
      
      // Add subtle glow for high volume (less aggressive)
      if (normalizedCurrent > 0.6) {
        ctx.shadowColor = isGreen ? '#26a69a' : '#ef5350'
        ctx.shadowBlur = 3
        ctx.fillRect(x + 2, bodyTop, barWidth - 4, minBodyHeight)
        ctx.shadowBlur = 0
      }
      
      x += barSpacing
    }
    
    // Add volume bars at the bottom (like real crypto charts)
    drawVolumeIndicators(ctx, canvas, dataArray, numBars)
  }

  const drawVolumeIndicators = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, numBars: number) => {
    const volumeHeight = canvas.height * 0.15 // Volume section height
    const volumeBottom = canvas.height * 0.98
    const barSpacing = canvas.width / numBars
    let x = barSpacing * 0.1

    for (let i = 0; i < numBars; i += 1) {
      // Reverse the volume data flow to match the main chart
      const reverseIndex = numBars - 1 - i
      const currentIndex = Math.floor((reverseIndex / numBars) * dataArray.length)
      const rawVolume = (dataArray[currentIndex] || 0) / 255
      
      // Enhanced volume calculation to prevent flat areas
      const baseVolume = 0.2 // Minimum volume to show activity
      const amplifiedVolume = rawVolume * 0.7 + baseVolume
      const volume = Math.min(amplifiedVolume, 1.0)
      
      const barHeight = volume * volumeHeight * 0.8
      
      // Volume bars are typically more muted
      ctx.fillStyle = `rgba(100, 149, 237, ${0.3 + volume * 0.4})` // Blue with varying opacity
      ctx.fillRect(x + 2, volumeBottom - barHeight, (canvas.width / numBars) * 0.8 - 4, barHeight)
      
      x += barSpacing
    }
  }

  const drawChartLabels = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Chart title with crypto exchange styling
    ctx.fillStyle = '#f0b90b' // Binance yellow
    ctx.font = 'bold 16px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
    ctx.fillText('GUDTEK/USDT', 15, 25)
    
    // Status indicator
    ctx.fillStyle = '#26a69a'
    ctx.font = '12px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
    ctx.fillText('● LIVE', 15, 45)
    
    // Timeframe indicator
    ctx.fillStyle = '#8d8d8d'
    ctx.font = '11px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
    ctx.fillText('1m', 70, 45)
    
    // Volume label
    ctx.fillStyle = '#8d8d8d'
    ctx.font = '9px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText('Volume', 15, canvas.height - 25)
    
    // Time labels at bottom
    ctx.textAlign = 'center'
    for (let i = 0; i <= 4; i++) {
      const x = (canvas.width / 4) * i
      const time = new Date(Date.now() - (4 - i) * 15000).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      ctx.fillText(time, x, canvas.height - 5)
    }
    
    ctx.textAlign = 'left' // Reset alignment
  }

  const togglePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
        } else {
          await audioRef.current.play()
        }
      } catch (error) {
        console.error('Error playing audio:', error)
        setIsPlaying(false)
      }
    }
  }

  const playTrack = async (track: Track) => {
    try {
      // Stop previous audio context
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
        analyserRef.current = null
        sourceRef.current = null
      }

      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      setCurrentTrack(track)
      setCurrentTime(0)
      setDuration(0)

      // Wait for the audio element to update its src
      await new Promise(resolve => setTimeout(resolve, 200))

      if (audioRef.current) {
        // Load the new track
        audioRef.current.load()
        
        // Wait a bit for the load to start
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Try to play - the event listeners will handle duration detection
        await audioRef.current.play()
        
        // Force duration update if available
        if (!isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
          setDuration(audioRef.current.duration)
        }
      }
    } catch (error) {
      console.error('Error playing track:', error)
      setIsPlaying(false)
    }
  }

  const nextTrack = () => {
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id)
    let nextIndex
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * tracks.length)
    } else {
      nextIndex = (currentIndex + 1) % tracks.length
    }
    
    playTrack(tracks[nextIndex])
  }

  const previousTrack = () => {
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id)
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1
    playTrack(tracks[prevIndex])
  }

  const seekTo = (value: number[]) => {
    if (audioRef.current && duration > 0) {
      const time = (value[0] / 100) * duration
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume([previousVolume])
      setIsMuted(false)
    } else {
      setPreviousVolume(volume[0])
      setIsMuted(true)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const downloadTrack = (track: Track) => {
    const link = document.createElement('a')
    link.href = `/Gudmusic/${track.filename}`
    link.download = track.filename
    link.click()
  }

  const shareToX = (track: Track) => {
    const shareText = `🎵 Currently vibing to "${track.title}" by GUD TEK! 🔥\n\n${track.description}\n\nCheck out the full GUD TEK music collection at ${currentUrl}/music`
    const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=GUDTEK,Solana,Music,Crypto`
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  const handleTrackEnd = () => {
    setIsPlaying(false)
    if (isRepeat) {
      playTrack(currentTrack)
    } else {
      nextTrack()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500">
      <Navbar />
      
      {/* Enhanced Background Pattern */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 pt-24 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ 
                scale: isPlaying ? [1, 1.1, 1] : [1],
                rotate: isPlaying ? [0, 5, -5, 0] : [0]
              }}
              transition={{ 
                duration: 2, 
                repeat: isPlaying ? Infinity : 0, 
                ease: "easeInOut" 
              }}
              className="mx-auto w-20 h-20 mb-6 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center"
            >
              <Headphones className="w-10 h-10 text-gray-900" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-4 tracking-tight">
              GUD MUSIC
            </h1>
            <p className="text-xl text-gray-800 max-w-2xl mx-auto mb-4">
              Immerse yourself in the sounds of the GUD TEK universe
            </p>
            <Badge className="bg-white/20 text-gray-900 border-white/30 px-4 py-2">
              {tracks.length} Exclusive Tracks
            </Badge>
          </motion.div>

          {/* Enhanced Professional Audio Visualizer */}
          <AnimatePresence>
            {showVisualizer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mb-8"
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Audio Frequency Analyzer
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowVisualizer(false)}
                          className="text-gray-700 hover:text-gray-900"
                        >
                          Hide
                        </Button>
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <canvas 
                          ref={canvasRef} 
                          width={1000} 
                          height={250} 
                          className="w-full h-60 rounded-lg border border-gray-700"
                          style={{ 
                            background: 'linear-gradient(135deg, #0c0c0f 0%, #1a1a23 100%)',
                            imageRendering: 'pixelated' 
                          }}
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <div className="bg-green-500/20 text-green-400 text-xs font-mono px-2 py-1 rounded border border-green-500/30">
                            LIVE
                          </div>
                          <div className="bg-blue-500/20 text-blue-400 text-xs font-mono px-2 py-1 rounded border border-blue-500/30">
                            60 FPS
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Enhanced Now Playing - Large Player */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="bg-white/20 backdrop-blur-lg border-white/30 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Static Album Art (No Rotation) */}
                    <div className="relative w-full md:w-80 h-80 mx-auto md:mx-0 flex-shrink-0">
                      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                        <Image
                          src={currentTrack.cover}
                          alt={`${currentTrack.title} cover`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 320px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        
                        {/* Static music note overlay when playing */}
                        {isPlaying && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-4 right-4"
                          >
                            <motion.div
                              animate={{ 
                                y: [0, -8, 0],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              }}
                              className="bg-white/20 backdrop-blur-lg rounded-full p-2"
                            >
                              <Music className="w-6 h-6 text-white" />
                            </motion.div>
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Enhanced floating play button */}
                      <motion.div
                        className="absolute bottom-4 right-4"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          onClick={togglePlayPause}
                          size="lg"
                          className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-gray-900 shadow-xl"
                        >
                          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                        </Button>
                      </motion.div>
                    </div>

                    {/* Enhanced Track Info & Controls */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Badge className="mb-4 bg-orange-500/20 text-orange-900 border-orange-400">
                          Now Playing
                        </Badge>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          {currentTrack.title}
                        </h2>
                        <p className="text-gray-700 text-lg mb-2">
                          GUD TEK Official
                        </p>
                        <p className="text-gray-600 text-sm mb-6 italic">
                          {currentTrack.description}
                        </p>

                        {/* Enhanced Action Buttons */}
                        <div className="flex gap-3 mb-8 flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadTrack(currentTrack)}
                            className="bg-white/20 border-white/30 hover:bg-white/30"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          
                          {/* Simple X/Twitter Share Button */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => shareToX(currentTrack)}
                            className="bg-white/20 border-white/30 hover:bg-white/30"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share on X
                          </Button>
                        </div>
                      </div>

                      {/* Enhanced Progress Bar */}
                      <div className="space-y-4">
                        <Slider
                          value={[duration ? (currentTime / duration) * 100 : 0]}
                          onValueChange={seekTo}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>

                        {/* Enhanced Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setIsShuffled(!isShuffled)}
                              className={`text-gray-800 hover:text-gray-900 ${isShuffled ? 'bg-white/20' : ''}`}
                            >
                              <Shuffle className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={previousTrack}
                              className="text-gray-800 hover:text-gray-900"
                            >
                              <SkipBack className="w-5 h-5" />
                            </Button>
                            <Button 
                              onClick={togglePlayPause}
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-12 h-12"
                            >
                              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={nextTrack}
                              className="text-gray-800 hover:text-gray-900"
                            >
                              <SkipForward className="w-5 h-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setIsRepeat(!isRepeat)}
                              className={`text-gray-800 hover:text-gray-900 ${isRepeat ? 'bg-white/20' : ''}`}
                            >
                              <Repeat className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Enhanced Volume Control */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleMute}
                              className="text-gray-800 hover:text-gray-900"
                            >
                              {isMuted || volume[0] === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                            <Slider
                              value={volume}
                              onValueChange={setVolume}
                              max={100}
                              step={1}
                              className="w-20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced Track List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Music className="w-6 h-6 mr-2" />
                Playlist
                <Badge className="ml-3 bg-white/20 text-gray-900 border-white/30">
                  {tracks.length}
                </Badge>
              </h3>
              
              {tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      currentTrack.id === track.id 
                        ? 'bg-white/30 border-orange-400 shadow-lg scale-105' 
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                    onClick={() => playTrack(track)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={track.cover}
                            alt={`${track.title} cover`}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                          {currentTrack.id === track.id && isPlaying && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                              >
                                <Pause className="w-4 h-4 text-white" />
                              </motion.div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {track.title}
                          </h4>
                          <p className="text-sm text-gray-700 mb-1">
                            GUD TEK Official
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {track.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {track.duration}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Audio Element */}
      <audio
        ref={audioRef}
        src={`/Gudmusic/${currentTrack.filename}`}
        crossOrigin="anonymous"
        preload="metadata"
        controls={false}
      />
    </div>
  )
} 