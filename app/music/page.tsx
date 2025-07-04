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
  },
  {
    id: 6,
    title: "We Say Gudtek",
    filename: "wesaygudtek.mp3",
    cover: "/Gudmusic/wesaygudtek.png",
    duration: "2:55",
    description: "The crowd anthem shouting WE SAY GUDTEK!"
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
      
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      
      const source = audioContext.createMediaElementSource(audioRef.current)
      source.connect(analyser)
      analyser.connect(audioContext.destination)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      sourceRef.current = source
    } catch (error) {
      console.error('Error setting up audio analyser:', error)
    }
  }

  const startVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return

    const draw = () => {
      if (!analyserRef.current || !canvasRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyserRef.current.getByteFrequencyData(dataArray)

      drawProfessionalTradingGrid(ctx, canvas)
      drawEnhancedCryptoChart(ctx, canvas, dataArray)
      drawVolumeIndicators(ctx, canvas, dataArray, 32)
      drawChartLabels(ctx, canvas)

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
  }

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = undefined
    }
  }

  const drawProfessionalTradingGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas
    
    // Clear canvas with dark background
    ctx.fillStyle = 'linear-gradient(135deg, #0c0c0f 0%, #1a1a23 100%)'
    ctx.fillRect(0, 0, width, height)
    
    // Professional grid lines
    ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)'
    ctx.lineWidth = 1
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = (height / 8) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    // Professional border
    ctx.strokeStyle = 'rgba(100, 100, 120, 0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, width, height)
  }

    const drawEnhancedCryptoChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
    const { width, height } = canvas
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    
    // Professional candlestick-style visualization
    const barWidth = chartWidth / dataArray.length
    const maxValue = Math.max(...dataArray)
    
    // Enhanced gradient for volume bars
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding)
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.9)')  // Green top
    gradient.addColorStop(0.3, 'rgba(59, 130, 246, 0.8)')  // Blue middle
    gradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.7)')  // Amber
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.6)')   // Red bottom
    
    // Draw main frequency bars
    ctx.fillStyle = gradient
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * chartHeight
      const x = padding + i * barWidth
      const y = height - padding - barHeight
      
      // Professional bar with rounded top
      ctx.fillRect(x, y, barWidth - 2, barHeight)
      
      // Add highlight on top of each bar
      if (barHeight > 10) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(x, y, barWidth - 2, 3)
        ctx.fillStyle = gradient
      }
    }
    
    // Draw moving average line
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    const movingAverage = []
    const windowSize = 5
    
    for (let i = 0; i < dataArray.length; i++) {
      let sum = 0
      let count = 0
      for (let j = Math.max(0, i - windowSize); j <= Math.min(dataArray.length - 1, i + windowSize); j++) {
        sum += dataArray[j]
        count++
      }
      movingAverage.push(sum / count)
    }
    
    for (let i = 0; i < movingAverage.length; i++) {
      const x = padding + i * barWidth + barWidth / 2
      const y = height - padding - (movingAverage[i] / 255) * chartHeight
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
    
    // Add glowing effect to the line
    ctx.shadowColor = 'rgba(34, 197, 94, 0.5)'
    ctx.shadowBlur = 5
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  const drawVolumeIndicators = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, numBars: number) => {
    const { width, height } = canvas
    const padding = 20
    const indicatorWidth = 80
    const indicatorHeight = 20
    
    // Volume indicator background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(width - indicatorWidth - padding, padding, indicatorWidth, indicatorHeight)
    
    // Calculate average volume
    const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length
    const volumePercent = avgVolume / 255
    
    // Volume bar
    const volumeBarWidth = (indicatorWidth - 10) * volumePercent
    const volumeColor = volumePercent > 0.7 ? 'rgba(239, 68, 68, 0.8)' : 
                       volumePercent > 0.4 ? 'rgba(245, 158, 11, 0.8)' : 
                       'rgba(34, 197, 94, 0.8)'
    
    ctx.fillStyle = volumeColor
    ctx.fillRect(width - indicatorWidth - padding + 5, padding + 5, volumeBarWidth, indicatorHeight - 10)
    
    // Volume text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '10px monospace'
    ctx.fillText('VOL', width - indicatorWidth - padding + 5, padding - 5)
  }

  const drawChartLabels = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas
    
    // Professional labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '11px monospace'
    
    // Y-axis labels (frequency ranges)
    const frequencies = ['20Hz', '200Hz', '2kHz', '20kHz']
    for (let i = 0; i < frequencies.length; i++) {
      const y = height - 40 - (i * (height - 80) / (frequencies.length - 1))
      ctx.fillText(frequencies[i], 5, y + 4)
    }
    
    // X-axis labels (time markers)
    const timeMarkers = ['0s', '1s', '2s', '3s', '4s']
    for (let i = 0; i < timeMarkers.length; i++) {
      const x = 40 + (i * (width - 80) / (timeMarkers.length - 1))
      ctx.fillText(timeMarkers[i], x - 10, height - 10)
    }
    
    // Add title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = 'bold 12px monospace'
    ctx.fillText('REAL-TIME FREQUENCY ANALYSIS', 40, 25)
    
    // Add current track info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '10px monospace'
    ctx.fillText(`NOW PLAYING: ${currentTrack.title.toUpperCase()}`, 40, height - 25)
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
      // First, stop all audio processing
      setIsPlaying(false)
      
      // Stop and clean up current audio context
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close()
          }
        } catch (error) {
          console.error('Error closing audio context:', error)
        }
        audioContextRef.current = null
        analyserRef.current = null
        sourceRef.current = null
      }

      // Stop current audio completely
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        // Force reload to clear any cached audio data
        audioRef.current.load()
      }

      // Reset state
      setCurrentTime(0)
      setDuration(0)
      setCurrentTrack(track)

      // Wait for the component to re-render with new track
      await new Promise(resolve => setTimeout(resolve, 100))

      if (audioRef.current) {
        // Set the new source explicitly
        audioRef.current.src = `/Gudmusic/${track.filename}`
        
        // Load the new track
        audioRef.current.load()
        
        // Wait for the load to complete
        await new Promise((resolve) => {
          const handleCanPlay = () => {
            audioRef.current?.removeEventListener('canplay', handleCanPlay)
            resolve(true)
          }
          audioRef.current?.addEventListener('canplay', handleCanPlay)
          
          // Timeout in case canplay doesn't fire
          setTimeout(resolve, 1000)
        })
        
        // Now try to play
        await audioRef.current.play()
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

      <div className="relative z-10 pt-16 sm:pt-24 px-3 sm:px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
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
              className="mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center"
            >
              <Headphones className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900" />
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight px-2">
              GUD MUSIC
            </h1>
            <p className="text-lg sm:text-xl text-gray-800 max-w-2xl mx-auto mb-3 sm:mb-4 px-4">
              Immerse yourself in the sounds of the GUD TEK universe
            </p>
            <Badge className="bg-white/20 text-gray-900 border-white/30 px-3 sm:px-4 py-1 sm:py-2 text-sm">
              {tracks.length} Exclusive Tracks
            </Badge>
          </motion.div>

          {/* Enhanced Professional Audio Visualizer - Mobile Responsive */}
          <AnimatePresence>
            {showVisualizer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mb-6 sm:mb-8"
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="hidden sm:inline">Audio Frequency Analyzer</span>
                        <span className="sm:hidden">Analyzer</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowVisualizer(false)}
                          className="text-gray-700 hover:text-gray-900 text-xs sm:text-sm"
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
                          className="w-full h-32 sm:h-48 md:h-60 rounded-lg border border-gray-700"
                          style={{ 
                            background: 'linear-gradient(135deg, #0c0c0f 0%, #1a1a23 100%)',
                            imageRendering: 'pixelated' 
                          }}
                        />
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 sm:gap-2">
                          <div className="bg-green-500/20 text-green-400 text-xs font-mono px-1 sm:px-2 py-1 rounded border border-green-500/30">
                            LIVE
                          </div>
                          <div className="bg-blue-500/20 text-blue-400 text-xs font-mono px-1 sm:px-2 py-1 rounded border border-blue-500/30">
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

          {/* Mobile-First Responsive Layout */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Enhanced Now Playing - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2 order-1"
            >
              <Card className="bg-white/20 backdrop-blur-lg border-white/30 overflow-hidden">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Mobile-First Album Art */}
                    <div className="relative w-full max-w-sm mx-auto sm:max-w-md lg:max-w-none lg:w-80 lg:mx-0 aspect-square lg:flex-shrink-0">
                      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                        <Image
                          src={currentTrack.cover}
                          alt={`${currentTrack.title} cover`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        
                        {/* Static music note overlay when playing */}
                        {isPlaying && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-3 sm:top-4 right-3 sm:right-4"
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
                              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </motion.div>
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Enhanced floating play button - Mobile Optimized */}
                      <motion.div
                        className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          onClick={togglePlayPause}
                          size="lg"
                          className="rounded-full w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/90 hover:bg-white text-gray-900 shadow-xl"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                          ) : (
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
                          )}
                        </Button>
                      </motion.div>
                    </div>

                    {/* Enhanced Track Info & Controls - Mobile Optimized */}
                    <div className="flex-1 flex flex-col justify-between text-center lg:text-left">
                      <div>
                        <Badge className="mb-3 sm:mb-4 bg-orange-500/20 text-orange-900 border-orange-400">
                          Now Playing
                        </Badge>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                          {currentTrack.title}
                        </h2>
                        <p className="text-gray-700 text-base sm:text-lg mb-2">
                          GUD TEK Official
                        </p>
                        <p className="text-gray-600 text-sm mb-4 sm:mb-6 italic px-2 lg:px-0">
                          {currentTrack.description}
                        </p>

                        {/* Enhanced Action Buttons - Mobile Responsive */}
                        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 justify-center lg:justify-start flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadTrack(currentTrack)}
                            className="bg-white/20 border-white/30 hover:bg-white/30 text-xs sm:text-sm"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Download</span>
                            <span className="sm:hidden">DL</span>
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => shareToX(currentTrack)}
                            className="bg-white/20 border-white/30 hover:bg-white/30 text-xs sm:text-sm"
                          >
                            <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>

                      {/* Enhanced Progress Bar - Mobile Optimized */}
                      <div className="space-y-3 sm:space-y-4">
                        <Slider
                          value={[duration ? (currentTime / duration) * 100 : 0]}
                          onValueChange={seekTo}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>

                        {/* Enhanced Controls - Mobile First */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setIsShuffled(!isShuffled)}
                              className={`text-gray-800 hover:text-gray-900 p-2 ${isShuffled ? 'bg-white/20' : ''}`}
                            >
                              <Shuffle className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={previousTrack}
                              className="text-gray-800 hover:text-gray-900 p-2"
                            >
                              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                            <Button 
                              onClick={togglePlayPause}
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12"
                            >
                              {isPlaying ? (
                                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={nextTrack}
                              className="text-gray-800 hover:text-gray-900 p-2"
                            >
                              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setIsRepeat(!isRepeat)}
                              className={`text-gray-800 hover:text-gray-900 p-2 ${isRepeat ? 'bg-white/20' : ''}`}
                            >
                              <Repeat className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>

                          {/* Enhanced Volume Control - Mobile Responsive */}
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleMute}
                              className="text-gray-800 hover:text-gray-900 p-2"
                            >
                              {isMuted || volume[0] === 0 ? (
                                <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                            </Button>
                            <Slider
                              value={volume}
                              onValueChange={setVolume}
                              max={100}
                              step={1}
                              className="w-16 sm:w-20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced Track List - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-3 sm:space-y-4 order-2"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center justify-center lg:justify-start">
                <Music className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Playlist
                <Badge className="ml-2 sm:ml-3 bg-white/20 text-gray-900 border-white/30 text-xs sm:text-sm">
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
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      currentTrack.id === track.id 
                        ? 'bg-white/30 border-orange-400 shadow-lg scale-105' 
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                    onClick={() => playTrack(track)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
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
                                <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </motion.div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                            {track.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-700 mb-1">
                            GUD TEK Official
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {track.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs sm:text-sm text-gray-600">
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