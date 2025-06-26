'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Users, 
  Bot, 
  Wallet, 
  Crown,
  Clock,
  Star,
  Gamepad2,
  Share2,
  AlertCircle,
  CheckCircle,
  Play,
  X,
  Send,
  Target,
  Award,
  Zap
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import FeedbackForm from '@/components/FeedbackForm'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import { 
  getWalletInfo, 
  formatTokenBalance,
  formatSolBalance,
  MIN_GUDTEK_BALANCE
} from '@/lib/wallet'
import { 
  createChessGame,
  updateChessGame,
  recordChessMove,
  getChessStats,
  updateChessStats,
  getChessLeaderboard,
  getUserChessGames
} from '@/lib/supabase'
import { io, Socket } from 'socket.io-client'
import { StockfishEngine, StockfishMove } from '@/lib/stockfish'

type GameMode = 'menu' | 'ai' | 'multiplayer' | 'spectate'
type GameStatus = 'waiting' | 'playing' | 'finished'
type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
type Color = 'w' | 'b'

interface GameState {
  mode: GameMode
  status: GameStatus
  chess: Chess
  gameId?: string
  playerColor?: Color
  opponent?: {
    wallet: string
    username?: string
  }
  timeControl: {
    initial: number // seconds
    increment: number // seconds per move
  }
  playerTime: {
    white: number
    black: number
  }
  lastMoveTime: number
  winner?: Color | 'draw'
  gameHistory: string[]
}

interface Challenge {
  id: string
  from: string
  to: string
  timeControl: { initial: number; increment: number }
  timestamp: number
}

// Stockfish chess engine integration

export default function ChessPage() {
  const { connected, publicKey } = useWallet()
  const [mounted, setMounted] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletInfo, setWalletInfo] = useState({
    gudtekBalance: 0,
    solBalance: 0,
    canPlay: false
  })
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    mode: 'menu',
    status: 'waiting',
    chess: new Chess(),
    timeControl: { initial: 600, increment: 10 }, // 10 minutes + 10 second increment
    playerTime: { white: 600, black: 600 },
    lastMoveTime: Date.now(),
    gameHistory: []
  })
  
  // UI state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [challengeWallet, setChallengeWallet] = useState('')
  const [aiDifficulty, setAiDifficulty] = useState(3)
  
  // Socket connection
  const socketRef = useRef<Socket | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const stockfishRef = useRef<StockfishEngine | null>(null)
  const [stockfishReady, setStockfishReady] = useState(false)
  
  // Hints and analysis state
  const [showHints, setShowHints] = useState(false)
  const [currentHint, setCurrentHint] = useState<string | null>(null)
  const [currentEvaluation, setCurrentEvaluation] = useState<any | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [analysisMode, setAnalysisMode] = useState(false)
  
  // Chess stats and leaderboard state
  const [chessStats, setChessStats] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)
  const [gameCreating, setGameCreating] = useState(false)
  
  // Handle hydration
  useEffect(() => {
    setMounted(true)
    
    // Initialize Stockfish
    stockfishRef.current = new StockfishEngine()
    
    // Check if Stockfish is ready periodically
    const checkStockfish = setInterval(() => {
      if (stockfishRef.current?.isEngineReady()) {
        setStockfishReady(true)
        clearInterval(checkStockfish)
      }
    }, 100)
    
    return () => {
      clearInterval(checkStockfish)
      if (stockfishRef.current) {
        stockfishRef.current.quit()
      }
    }
  }, [])

  // Load wallet info when wallet connects
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (connected && publicKey) {
      loadWalletInfo()
      loadChessStats()
    } else {
      setWalletInfo({
        gudtekBalance: 0,
        solBalance: 0,
        canPlay: false
      })
      setChessStats(null)
    }
  }, [connected, publicKey])

  // Load leaderboard on mount
  useEffect(() => {
    loadLeaderboard()
  }, [])
  
  // Initialize socket connection
  useEffect(() => {
    if (connected && publicKey) {
      socketRef.current = io('ws://localhost:3001', {
        transports: ['websocket'],
        timeout: 10000,
      })
      
      const socket = socketRef.current
      
      socket.on('connect', () => {
        console.log('Connected to chess server')
        socket.emit('authenticate', { wallet: publicKey.toString() })
      })
      
      socket.on('challenge_received', handleChallengeReceived)
      socket.on('challenge_accepted', handleChallengeAccepted)
      socket.on('challenge_declined', handleChallengeDeclined)
      socket.on('opponent_move', handleOpponentMove)
      socket.on('game_end', handleGameEnd)
      socket.on('opponent_disconnected', handleOpponentDisconnected)
      
      return () => {
        socket.disconnect()
      }
    }
  }, [connected, publicKey])

  const loadWalletInfo = async () => {
    if (!publicKey) return
    
    setWalletLoading(true)
    try {
      const info = await getWalletInfo(publicKey.toString())
      setWalletInfo({
        gudtekBalance: info.gudtekBalance,
        solBalance: info.solBalance,
        canPlay: info.gudtekBalance >= MIN_GUDTEK_BALANCE
      })
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

  const handleChallengeReceived = (challenge: Challenge) => {
    setChallenges(prev => [...prev, challenge])
    toast({
      title: "Chess Challenge!",
      description: `${challenge.from.slice(0, 8)}... wants to play!`,
    })
  }

  const handleChallengeAccepted = (gameId: string, opponent: string, color: Color) => {
    setGameState(prev => ({
      ...prev,
      mode: 'multiplayer',
      status: 'playing',
      gameId,
      playerColor: color,
      opponent: { wallet: opponent },
      chess: new Chess()
    }))
    
    toast({
      title: "Challenge Accepted!",
      description: `Game started! You are playing as ${color === 'w' ? 'White' : 'Black'}`,
    })
  }

  const handleChallengeDeclined = (challengeId: string) => {
    setChallenges(prev => prev.filter(c => c.id !== challengeId))
    toast({
      title: "Challenge Declined",
      description: "Your opponent declined the challenge",
      variant: "destructive",
    })
  }

  const handleOpponentMove = (move: string) => {
    setGameState(prev => {
      const newChess = new Chess(prev.chess.fen())
      try {
        newChess.move(move)
        return {
          ...prev,
          chess: newChess,
          gameHistory: [...prev.gameHistory, move]
        }
      } catch (error) {
        console.error('Invalid move received:', move, error)
        return prev
      }
    })
  }

  const handleGameEnd = (winner: Color | 'draw', reason?: string) => {
    setGameState(prev => ({
      ...prev,
      status: 'finished',
      winner
    }))
    
    const message = winner === 'draw' 
      ? 'Game ended in a draw!' 
      : `${winner === 'w' ? 'White' : 'Black'} wins!`
    
    toast({
      title: "Game Over",
      description: message + (reason ? ` (${reason})` : ''),
    })
  }

  const handleOpponentDisconnected = () => {
    toast({
      title: "Opponent Disconnected",
      description: "Your opponent has left the game",
      variant: "destructive",
    })
  }

  const sendChallenge = async () => {
    if (!challengeWallet || !socketRef.current) return
    
    try {
      socketRef.current.emit('send_challenge', {
        to: challengeWallet,
        timeControl: gameState.timeControl
      })
      
      toast({
        title: "Challenge Sent!",
        description: `Challenge sent to ${challengeWallet.slice(0, 8)}...`,
      })
      
      setChallengeWallet('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send challenge",
        variant: "destructive",
      })
    }
  }

  const acceptChallenge = (challengeId: string) => {
    if (!socketRef.current) return
    
    socketRef.current.emit('accept_challenge', { challengeId })
    setChallenges(prev => prev.filter(c => c.id !== challengeId))
  }

  const declineChallenge = (challengeId: string) => {
    if (!socketRef.current) return
    
    socketRef.current.emit('decline_challenge', { challengeId })
    setChallenges(prev => prev.filter(c => c.id !== challengeId))
  }

  const startAIGame = async () => {
    if (!stockfishRef.current || !stockfishReady) {
      toast({
        title: "Engine Not Ready",
        description: "Stockfish engine is still loading. Please wait a moment and try again.",
        variant: "destructive"
      })
      return
    }

    setGameCreating(true)
    console.log('🔄 Starting game creation process...')

    const newChess = new Chess()
    let playerColor: Color = gameState.playerColor || 'w'
    
    if (playerColor === 'random' as any) {
      playerColor = Math.random() < 0.5 ? 'w' : 'b'
    }
    
    // Create game in database - CRITICAL: This must happen BEFORE setting game state
    try {
      const gameId = await createNewGame('ai', playerColor)
      console.log('✅ Game created in database:', gameId)
      if (!gameId) {
        throw new Error('Game creation returned null')
      }
      console.log('🎮 Game fully initialized - moves now allowed')
    } catch (error) {
      console.error('❌ Failed to create game in database:', error)
      toast({
        title: "Database Error", 
        description: "Failed to save game to database, but you can still play!",
        variant: "destructive"
      })
      // Set a temporary game ID so moves can still be tracked locally
      const tempId = 'temp-' + Date.now()
      console.log('🎯 Setting temporary currentGameId to:', tempId)
      setCurrentGameId(tempId)
      console.log('🎯 Temporary currentGameId state should now be:', tempId)
    } finally {
      setGameCreating(false)
      console.log('🎮 Game creation process completed')
    }
    
    // Configure Stockfish for this game
    stockfishRef.current.setDifficulty(aiDifficulty)
    stockfishRef.current.setStartPosition([])
    
    setGameState(prev => ({
      ...prev,
      mode: 'ai',
      status: 'playing',
      chess: newChess,
      playerColor: playerColor,
      gameHistory: []
    }))
    
    toast({
      title: "Game Started!",
      description: `Playing vs Stockfish (Level: ${['', 'Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert'][aiDifficulty]}) as ${playerColor === 'w' ? 'White' : 'Black'}`
    })
    
    // If player is black, AI makes the first move
    if (playerColor === 'b') {
      setTimeout(() => {
        makeStockfishMove()
      }, 500)
    }
  }

  const makeMove = async (from: string, to: string) => {
    // Prevent moves while game is being created
    if (gameCreating) {
      console.warn('⚠️ Move blocked: Game is still being created')
      toast({
        title: "Game Loading",
        description: "Please wait for the game to finish loading.",
        variant: "destructive"
      })
      return false
    }

    try {
      // Create a copy of the current chess state to test the move
      const testChess = new Chess(gameState.chess.fen())
      const move = testChess.move({ from, to, promotion: 'q' })
      
      if (!move) {
        console.log('Invalid move attempted:', { from, to })
        
        // Get suggestions for valid moves from this square
        const piece = gameState.chess.get(from as any)
        if (piece && piece.color === gameState.chess.turn()) {
          const validMoves = gameState.chess.moves({ square: from as any, verbose: true })
          if (validMoves.length > 0) {
            const suggestions = validMoves.slice(0, 3).map(move => move.san).join(', ')
            toast({
              title: "Invalid Move",
              description: `That move is not allowed. Try: ${suggestions}`,
              variant: "destructive"
            })
          } else {
            toast({
              title: "Invalid Move", 
              description: "That piece cannot move from this position.",
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Invalid Move",
            description: "You cannot move that piece right now.",
            variant: "destructive"
          })
        }
        return false
      }

      // Move is valid, apply it to the actual game state
      const actualMove = gameState.chess.move({ from, to, promotion: 'q' })
      if (!actualMove) {
        console.error('Move validation inconsistency')
        return false
      }

      // Save move to database
      try {
        await saveGameMove(actualMove, 1000) // Default 1 second for now
        console.log('✅ Move saved to database:', actualMove.san)
      } catch (error) {
        console.error('❌ Failed to save move to database:', error)
      }

      // Update the game state with the new position
      setGameState(prev => ({
        ...prev,
        chess: prev.chess, // Keep the same chess instance (already updated)
        gameHistory: [...prev.gameHistory, actualMove.san]
      }))

      // Send move to opponent if in multiplayer
      if (gameState.mode === 'multiplayer' && socketRef.current) {
        socketRef.current.emit('make_move', {
          gameId: gameState.gameId,
          move: actualMove.san
        })
      }

      // Check if game is over
      if (gameState.chess.isGameOver()) {
        let winner: Color | 'draw' = 'draw'
        if (gameState.chess.isCheckmate()) {
          winner = gameState.chess.turn() === 'w' ? 'b' : 'w'
        }
        
        setGameState(prev => ({
          ...prev,
          status: 'finished',
          winner
        }))
        
        // Save game result to database
        const dbWinner = winner === 'w' ? 'white' : winner === 'b' ? 'black' : winner
        try {
          await finishGame(dbWinner)
          console.log('✅ Game finished and saved to database:', dbWinner)
        } catch (error) {
          console.error('❌ Failed to save game result to database:', error)
        }
        
        toast({
          title: "Game Over!",
          description: winner === 'draw' ? 'Game ended in a draw' : 
                      winner === gameState.playerColor ? 'You won!' : 'You lost!'
        })
        return true
      }

      // Make Stockfish move if playing against AI and it's now AI's turn
      if (gameState.mode === 'ai' && gameState.chess.turn() !== gameState.playerColor) {
        setTimeout(() => makeStockfishMove(), 500)
      }

      return true
    } catch (error) {
      console.log('Invalid move error:', error)
      toast({
        title: "Invalid Move",
        description: "That move is not allowed. Please try a different move.",
        variant: "destructive"
      })
      return false
    }
  }

  const makeStockfishMove = async () => {
    if (!stockfishRef.current || !stockfishReady) return
    
    try {
      // Get current FEN position
      const currentFen = gameState.chess.fen()
      console.log('Current position FEN:', currentFen)
      
      // Get best move from Stockfish API
      const stockfishMove = await stockfishRef.current.getBestMove(currentFen)
      
      if (stockfishMove) {
        const move = gameState.chess.move({
          from: stockfishMove.from,
          to: stockfishMove.to,
          promotion: stockfishMove.promotion as any
        })
        
        if (move) {
          // Save AI move to database
          try {
            await saveGameMove(move, 500) // AI moves typically fast
            console.log('✅ AI move saved to database:', move.san)
          } catch (error) {
            console.error('❌ Failed to save AI move to database:', error)
          }

          setGameState(prev => ({
            ...prev,
            chess: prev.chess, // Keep the same chess instance (already updated)
            gameHistory: [...prev.gameHistory, move.san]
          }))
          
          // Check for game end using the current chess instance
          if (gameState.chess.isGameOver()) {
            let winner: Color | 'draw' = 'draw'
            if (gameState.chess.isCheckmate()) {
              winner = gameState.chess.turn() === 'w' ? 'b' : 'w'
            }
            
            setGameState(prev => ({
              ...prev,
              status: 'finished',
              winner
            }))
            
            // Save game result to database
            const dbWinner = winner === 'w' ? 'white' : winner === 'b' ? 'black' : winner
            try {
              await finishGame(dbWinner)
              console.log('✅ AI game finished and saved to database:', dbWinner)
            } catch (error) {
              console.error('❌ Failed to save AI game result to database:', error)
            }
            
            toast({
              title: "Game Over!",
              description: winner === 'draw' ? 'Game ended in a draw' : 
                          winner === gameState.playerColor ? 'You won!' : 'Stockfish won!'
            })
          }
        }
      }
    } catch (error) {
      console.error('Stockfish move error:', error)
      toast({
        title: "Engine Error",
        description: "Stockfish encountered an error. The game will continue without AI.",
        variant: "destructive"
      })
    }
  }

  const onSquareClick = async (square: string) => {
    console.log('Square clicked:', square, 'Game status:', gameState.status, 'Mode:', gameState.mode)
    
    if (gameState.status !== 'playing') {
      console.log('Game not in playing state')
      return
    }
    
    // If in multiplayer, check if it's player's turn
    if (gameState.mode === 'multiplayer' && gameState.playerColor !== gameState.chess.turn()) {
      console.log('Not player turn in multiplayer')
      toast({
        title: "Not Your Turn",
        description: "Wait for your opponent to move.",
        variant: "destructive"
      })
      return
    }
    
    // If playing AI and it's not the player's turn, don't allow moves
    if (gameState.mode === 'ai' && gameState.chess.turn() !== gameState.playerColor) {
      console.log('Not player turn in AI game')
      toast({
        title: "Not Your Turn",
        description: "Wait for the AI to move.",
        variant: "destructive"
      })
      return
    }

    if (selectedSquare) {
      if (selectedSquare === square) {
        // Deselect
        console.log('Deselecting square')
        setSelectedSquare(null)
        setPossibleMoves([])
      } else {
        // Try to make move
        console.log('Attempting move from', selectedSquare, 'to', square)
        const success = await makeMove(selectedSquare, square)
        if (success) {
          setSelectedSquare(null)
          setPossibleMoves([])
        } else {
          // Try to select new square if it has a piece of current player
          const piece = gameState.chess.get(square as any)
          console.log('Move failed, checking if can select new piece:', piece)
          if (piece && piece.color === gameState.chess.turn()) {
            setSelectedSquare(square)
            const moves = gameState.chess.moves({ square: square as any, verbose: true })
            setPossibleMoves(moves.map(move => move.to))
            console.log('Selected new piece with', moves.length, 'possible moves')
          } else {
            // Clear selection if clicking on invalid square
            setSelectedSquare(null)
            setPossibleMoves([])
          }
        }
      }
    } else {
      // Select square if it has a piece of current player
      const piece = gameState.chess.get(square as any)
      console.log('No piece selected, checking square:', piece)
      if (piece && piece.color === gameState.chess.turn()) {
        setSelectedSquare(square)
        const moves = gameState.chess.moves({ square: square as any, verbose: true })
        setPossibleMoves(moves.map(move => move.to))
        console.log('Selected piece with', moves.length, 'possible moves')
      } else if (piece && piece.color !== gameState.chess.turn()) {
        toast({
          title: "Wrong Piece",
          description: "You can only move your own pieces.",
          variant: "destructive"
        })
      }
    }
  }

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      mode: 'menu',
      status: 'waiting',
      chess: new Chess(),
      gameId: undefined,
      playerColor: undefined,
      opponent: undefined,
      winner: undefined,
      gameHistory: []
    }))
    setSelectedSquare(null)
    setPossibleMoves([])
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Hint system functions
  const getHint = async () => {
    if (!stockfishRef.current || !stockfishReady) {
      toast({
        title: "Chess Engine Not Ready",
        description: "Please wait for the chess engine to initialize.",
        variant: "destructive"
      })
      return
    }

    setLoadingHint(true)
    try {
      const fen = gameState.chess.fen()
      
      // Get best move from Stockfish
      const bestMove = await stockfishRef.current.getBestMove(fen)
      const evaluation = await stockfishRef.current.getEvaluation(fen)
      
      if (bestMove) {
        // Create human-readable hint
        const piece = gameState.chess.get(bestMove.from as any)
        const pieceName = getPieceName(piece?.type, piece?.color)
        const hint = `💡 Consider moving ${pieceName} from ${bestMove.from} to ${bestMove.to}`
        
        setCurrentHint(hint)
        setCurrentEvaluation(evaluation)
        setShowHints(true)
        
        // Highlight suggested move
        setPossibleMoves([bestMove.from, bestMove.to])
        
        toast({
          title: "💡 Chess Hint",
          description: hint,
          duration: 5000
        })
      } else {
        toast({
          title: "No Hint Available",
          description: "Could not analyze current position.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error getting hint:', error)
      toast({
        title: "Hint Error",
        description: "Failed to get chess hint. Try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingHint(false)
    }
  }

  const getPieceName = (type?: PieceSymbol, color?: Color): string => {
    if (!type || !color) return 'piece'
    
    const pieceNames = {
      'p': 'pawn',
      'n': 'knight', 
      'b': 'bishop',
      'r': 'rook',
      'q': 'queen',
      'k': 'king'
    }
    
    return `${color === 'w' ? 'white' : 'black'} ${pieceNames[type]}`
  }

  const getPositionEvaluation = (evaluation: any): string => {
    if (!evaluation) return "Position unclear"
    
    if (evaluation.mate) {
      return evaluation.mate > 0 ? `Mate in ${evaluation.mate}` : `Opponent mate in ${Math.abs(evaluation.mate)}`
    }
    
    const score = evaluation.score / 100 // Convert from centipawns
    if (Math.abs(score) < 0.5) return "Equal position"
    if (score > 2) return "White has a winning advantage"
    if (score > 1) return "White has a strong advantage" 
    if (score > 0.5) return "White is slightly better"
    if (score < -2) return "Black has a winning advantage"
    if (score < -1) return "Black has a strong advantage"
    if (score < -0.5) return "Black is slightly better"
    
    return "Position unclear"
  }

  // Chess stats and database functions
  const loadChessStats = async () => {
    if (!publicKey) return
    
    setLoadingStats(true)
    try {
      const stats = await getChessStats(publicKey.toString())
      setChessStats(stats)
    } catch (error) {
      console.error('Error loading chess stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true)
    try {
      const data = await getChessLeaderboard(50)
      setLeaderboard(data)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoadingLeaderboard(false)
    }
  }

  const createNewGame = async (gameMode: 'ai' | 'multiplayer', playerColor: Color = 'w', opponentWallet?: string) => {
    if (!publicKey) {
      console.warn('⚠️ Cannot create game: Wallet not connected')
      return null
    }
    
    console.log('🎮 Creating new chess game...', { 
      gameMode, 
      playerColor, 
      publicKey: publicKey.toString(),
      opponentWallet 
    })
    
    try {
      const gameData = await createChessGame({
        playerWhite: playerColor === 'w' ? publicKey.toString() : (opponentWallet || 'AI'),
        playerBlack: playerColor === 'b' ? publicKey.toString() : (opponentWallet || 'AI'),
        gameMode,
        timeControl: gameState.timeControl.initial
      })
      
      console.log('✅ Game created successfully:', gameData)
      console.log('🎯 Setting currentGameId to:', gameData.id)
      setCurrentGameId(gameData.id)
      console.log('🎯 currentGameId state should now be:', gameData.id)
      return gameData.id
    } catch (error) {
      console.error('❌ Error creating game:', error)
      return null
    }
  }

  const saveGameMove = async (move: any, timeTaken: number) => {
    console.log('🔍 saveGameMove called:', { 
      move: move.san, 
      currentGameId, 
      hasGameId: !!currentGameId,
      gameIdType: typeof currentGameId
    })
    
    if (!currentGameId) {
      console.warn('⚠️ Cannot save move: No active game ID', {
        currentGameId,
        gameState: gameState.mode,
        publicKey: publicKey?.toString()
      })
      return
    }
    
    console.log('💾 Saving move to database...', { 
      move: move.san, 
      gameId: currentGameId, 
      timeTaken 
    })
    
    try {
      await recordChessMove({
        gameId: currentGameId,
        moveNumber: Math.ceil(gameState.chess.history().length / 2),
        player: gameState.chess.turn() === 'w' ? 'black' : 'white', // Previous player
        moveSan: move.san,
        moveUci: `${move.from}${move.to}${move.promotion || ''}`,
        positionFen: gameState.chess.fen(),
        timeTaken
      })
      console.log('✅ Move saved successfully')
    } catch (error) {
      console.error('❌ Error saving move:', error)
    }
  }

  const finishGame = async (winner: 'white' | 'black' | 'draw' | null) => {
    if (!currentGameId || !publicKey) {
      console.warn('⚠️ Cannot finish game: Missing gameId or wallet not connected')
      return
    }
    
    console.log('🏁 Finishing game...', { gameId: currentGameId, winner })
    
    try {
      // Update game in database
      await updateChessGame(currentGameId, {
        status: 'completed',
        winner,
        pgn: gameState.chess.pgn(),
        finalFen: gameState.chess.fen()
      })
      console.log('✅ Game updated in database')

      // Update player stats
      const playerColor = gameState.playerColor
      let result: 'win' | 'loss' | 'draw'
      
      if (winner === 'draw') {
        result = 'draw'
      } else if ((winner === 'white' && playerColor === 'w') || (winner === 'black' && playerColor === 'b')) {
        result = 'win'
      } else {
        result = 'loss'
      }

      console.log('📊 Updating player stats...', { result, wallet: publicKey.toString() })
      const gameTime = Date.now() - gameState.lastMoveTime
      await updateChessStats(publicKey.toString(), result, Math.floor(gameTime / 1000))
      console.log('✅ Player stats updated')
      
      // Reload stats
      await loadChessStats()
      console.log('✅ Stats reloaded')
      
      toast({
        title: "Game Saved",
        description: `Your ${result} has been recorded and ELO updated!`,
        duration: 3000
      })
    } catch (error) {
      console.error('❌ Error finishing game:', error)
      toast({
        title: "Save Error",
        description: "Failed to save game result to database",
        variant: "destructive"
      })
    }
  }

  if (!mounted) return null

  const canPlay = connected && publicKey && walletInfo.canPlay

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Global Navbar Component */}
      <Navbar />

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
              <Crown className="w-6 h-6 text-gray-900" />
              <span className="text-lg font-black text-gray-900">GUDTEK CHESS</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
              Chess Arena
            </h1>
            <p className="text-xl font-bold text-gray-800 max-w-2xl mx-auto">
              Challenge players, battle AI, prove your chess mastery! ♛
            </p>
          </motion.div>

          {/* Wallet Connection Section - matching game.tsx and memes.tsx */}
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
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          SOL: {walletLoading ? '...' : formatSolBalance(walletInfo.solBalance)}
                        </span>
                        <span className="text-purple-700 font-bold">
                          ELO: {loadingStats ? '...' : (chessStats?.elo_rating || 1200)}
                        </span>
                      </div>
                      {chessStats && (
                        <p className="text-xs text-gray-500 mt-1">
                          Games: {chessStats.total_games} | W: {chessStats.wins} | L: {chessStats.losses} | D: {chessStats.draws}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-bold text-gray-900 mb-1">Connect Your Wallet</p>
                      <p className="text-sm text-gray-700">To play chess and challenge others</p>
                    </div>
                  )}
                </div>
                <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 !border !border-gray-900 !rounded !font-bold !shadow-sm !px-2 !py-1 !text-xs !h-8 !min-w-0 scale-75" />
              </div>
            </div>
          </motion.div>

          {/* Wallet Status Alert - matching game.tsx and memes.tsx */}
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
                    ♛ Ready to play chess! Choose your game mode below.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-2 border-red-400 bg-red-100/80 backdrop-filter backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-bold">
                    ❌ Need at least {MIN_GUDTEK_BALANCE.toLocaleString()} $GUDTEK tokens to play chess.
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}

          {!canPlay ? (
            // Show welcome screen when wallet not connected or insufficient balance
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 z-0"></div>
                <CardHeader className="text-center relative z-10">
                  <CardTitle className="text-gray-800 dark:text-white flex items-center justify-center gap-2 text-2xl">
                    <Crown className="w-8 h-8 text-yellow-500" />
                    GudTek Chess Features
                  </CardTitle>
                  <CardDescription className="text-gray-700 dark:text-gray-200 text-lg">
                    Premium chess experience for $GUDTEK holders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                          <Bot className="text-white w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">AI Opponents</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">5 difficulty levels</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center shadow-md">
                          <Users className="text-white w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">Live Multiplayer</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">Challenge other wallets</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-md">
                          <Clock className="text-white w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">Time Controls</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">Blitz, Rapid, Classical</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center shadow-md">
                          <Trophy className="text-white w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">Leaderboards</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">ELO rating system</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center pt-6 border-t border-white/20">
                    <p className="text-gray-700 dark:text-gray-200 mb-4">
                      Connect your wallet and hold at least <span className="font-bold text-orange-600">{MIN_GUDTEK_BALANCE.toLocaleString()} $GUDTEK</span> to start playing!
                    </p>
                    {!connected && (
                      <WalletMultiButton className="!bg-gradient-to-r !from-orange-500 !to-yellow-500 hover:!from-orange-600 hover:!to-yellow-600 !border-none !rounded-lg !font-bold !shadow-lg !px-8 !py-3" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            // Main chess interface
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-7xl mx-auto"
            >
              <Tabs defaultValue="ai" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg mb-8">
                  <TabsTrigger value="ai" className="data-[state=active]:bg-white/30">
                    <Bot className="w-4 h-4 mr-2" />
                    vs AI
                  </TabsTrigger>
                  <TabsTrigger value="multiplayer" className="data-[state=active]:bg-white/30">
                    <Users className="w-4 h-4 mr-2" />
                    Multiplayer
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white/30">
                    <Trophy className="w-4 h-4 mr-2" />
                    Leaderboard
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="space-y-6">
                  {gameState.mode === 'menu' ? (
                    <div className="max-w-2xl mx-auto">
                      <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 z-0"></div>
                        <CardHeader className="relative z-10">
                          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                            <Bot className="w-6 h-6 text-blue-500" />
                            Play vs AI
                          </CardTitle>
                          <CardDescription className="text-gray-700 dark:text-gray-200">
                            Challenge our chess AI with 5 difficulty levels
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                          <div className="space-y-2">
                            <Label className="text-gray-800 dark:text-white font-medium">AI Difficulty</Label>
                            <Select value={aiDifficulty.toString()} onValueChange={(value) => setAiDifficulty(parseInt(value))}>
                              <SelectTrigger className="bg-white/20 border-white/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Beginner (Easy)</SelectItem>
                                <SelectItem value="2">Novice (Casual)</SelectItem>
                                <SelectItem value="3">Intermediate (Balanced)</SelectItem>
                                <SelectItem value="4">Advanced (Challenging)</SelectItem>
                                <SelectItem value="5">Expert (Very Hard)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-800 dark:text-white font-medium">Your Color</Label>
                            <Select 
                              value={gameState.playerColor || 'w'} 
                              onValueChange={(value: Color) => setGameState(prev => ({ ...prev, playerColor: value }))}
                            >
                              <SelectTrigger className="bg-white/20 border-white/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="w">White (You move first)</SelectItem>
                                <SelectItem value="b">Black (AI moves first)</SelectItem>
                                <SelectItem value="random">Random</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={startAIGame} 
                            disabled={!stockfishReady}
                            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                          >
                            {stockfishReady ? (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Start Stockfish Game
                              </>
                            ) : (
                              <>
                                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Loading Stockfish...
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ) : gameState.mode === 'ai' ? (
                    // AI Game in progress
                    <div className="grid lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                          <CardContent className="p-6">
                            <div className="aspect-square max-w-[600px] mx-auto relative">
                              <Chessboard
                                position={gameState.chess.fen()}
                                onSquareClick={gameCreating ? () => {} : onSquareClick}
                                arePiecesDraggable={false}
                                customSquareStyles={{
                                  ...(selectedSquare && {
                                    [selectedSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
                                  }),
                                  ...possibleMoves.reduce((styles, square) => ({
                                    ...styles,
                                    [square]: { backgroundColor: 'rgba(0, 255, 0, 0.4)' }
                                  }), {})
                                }}
                                boardOrientation={gameState.playerColor === 'b' ? 'black' : 'white'}
                              />
                              {gameCreating && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                  <div className="bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg flex items-center gap-3">
                                    <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                    <span className="font-medium text-gray-800 dark:text-white">
                                      Creating Game...
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-6">
                        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                          <CardHeader>
                            <CardTitle className="text-gray-800 dark:text-white flex items-center gap-2">
                              <Bot className="w-5 h-5 text-blue-500" />
                              vs AI Game
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 dark:text-gray-200">Engine:</span>
                              <Badge variant="secondary">
                                Stockfish {['', 'Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert'][aiDifficulty]}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 dark:text-gray-200">Turn:</span>
                              <Badge variant={gameState.chess.turn() === 'w' ? 'default' : 'secondary'}>
                                {gameState.chess.turn() === 'w' ? 'White' : 'Black'}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 dark:text-gray-200">You:</span>
                              <Badge>
                                {gameState.playerColor === 'w' ? 'White' : 'Black'}
                              </Badge>
                            </div>
                            {gameState.chess.isGameOver() && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-200">Result:</span>
                                <Badge variant={gameState.winner === gameState.playerColor ? 'default' : 'destructive'}>
                                  {gameState.winner === 'draw' ? 'Draw' : 
                                   gameState.winner === gameState.playerColor ? 'You Win!' : 'AI Wins'}
                                </Badge>
                              </div>
                            )}
                            <Button onClick={resetGame} variant="outline" className="w-full">
                              <X className="w-4 h-4 mr-2" />
                              New Game
                            </Button>
                            
                            {/* Debug button for testing database saves */}
                            {connected && (
                              <Button 
                                onClick={async () => {
                                  console.log('🧪 Testing database save...')
                                  try {
                                    await updateChessStats(publicKey!.toString(), 'win', 300)
                                    console.log('✅ Test save successful!')
                                    toast({
                                      title: "Database Test",
                                      description: "Database save test successful!",
                                    })
                                    await loadChessStats()
                                  } catch (error) {
                                    console.error('❌ Test save failed:', error)
                                    toast({
                                      title: "Database Test",
                                      description: "Database save test failed!",
                                      variant: "destructive"
                                    })
                                  }
                                }} 
                                variant="outline" 
                                className="w-full text-xs"
                              >
                                🧪 Test DB Save
                              </Button>
                            )}
                          </CardContent>
                        </Card>

                        {/* Hints & Analysis Card */}
                        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                          <CardHeader>
                            <CardTitle className="text-gray-800 dark:text-white flex items-center gap-2">
                              <Target className="w-5 h-5 text-purple-500" />
                              Chess Hints & Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Button 
                              onClick={getHint} 
                              disabled={loadingHint || !stockfishReady || gameState.chess.isGameOver()}
                              className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50"
                            >
                              {loadingHint ? (
                                <>
                                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Target className="w-4 h-4 mr-2" />
                                  Get Hint
                                </>
                              )}
                            </Button>
                            
                            {currentHint && (
                              <div className="bg-purple-100/20 border border-purple-300/30 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                                  💡 Chess Hint:
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-200">
                                  {currentHint}
                                </div>
                              </div>
                            )}
                            
                            {currentEvaluation && (
                              <div className="bg-blue-100/20 border border-blue-300/30 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                                  📊 Position Analysis:
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-200">
                                  {getPositionEvaluation(currentEvaluation)}
                                </div>
                                {currentEvaluation.pv && currentEvaluation.pv.length > 0 && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                    Best line: {currentEvaluation.pv.slice(0, 5).join(' ')}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <Button 
                              onClick={() => {
                                setCurrentHint(null)
                                setCurrentEvaluation(null)
                                setPossibleMoves([])
                                setShowHints(false)
                              }}
                              variant="outline" 
                              className="w-full text-sm"
                            >
                              Clear Hints
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                          <CardHeader>
                            <CardTitle className="text-gray-800 dark:text-white flex items-center gap-2">
                              <Award className="w-5 h-5 text-yellow-500" />
                              Game Status
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {gameState.chess.isCheck() && (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-bold">Check!</span>
                              </div>
                            )}
                            {gameState.chess.isCheckmate() && (
                              <div className="flex items-center gap-2 text-red-600">
                                <Trophy className="w-4 h-4" />
                                <span className="font-bold">Checkmate!</span>
                              </div>
                            )}
                            {gameState.chess.isStalemate() && (
                              <div className="flex items-center gap-2 text-yellow-600">
                                <Zap className="w-4 h-4" />
                                <span className="font-bold">Stalemate!</span>
                              </div>
                            )}
                            {gameState.chess.isDraw() && (
                              <div className="flex items-center gap-2 text-yellow-600">
                                <Target className="w-4 h-4" />
                                <span className="font-bold">Draw!</span>
                              </div>
                            )}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Move: {gameState.chess.history().length === 0 ? 1 : Math.ceil(gameState.chess.history().length / 2)}
                              {gameState.chess.turn() === 'b' && gameState.chess.history().length % 2 === 1 ? '...' : ''}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Total plies: {gameState.chess.history().length}
                            </div>
                            {gameState.chess.history().length > 0 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 max-h-20 overflow-y-auto">
                                <div className="font-medium mb-1">Recent moves:</div>
                                <div className="space-y-1">
                                  {gameState.chess.history().slice(-8).reduce((pairs: string[], move, index) => {
                                    const actualIndex = gameState.chess.history().length - 8 + index
                                    const moveNumber = Math.floor(actualIndex / 2) + 1
                                    
                                    if (actualIndex % 2 === 0) {
                                      // White move
                                      pairs.push(`${moveNumber}. ${move}`)
                                    } else {
                                      // Black move
                                      if (pairs.length > 0) {
                                        pairs[pairs.length - 1] += ` ${move}`
                                      } else {
                                        pairs.push(`${moveNumber}... ${move}`)
                                      }
                                    }
                                    return pairs
                                  }, []).map((movePair, index) => (
                                    <div key={index} className="text-xs">
                                      {movePair}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="multiplayer" className="space-y-6">
                  {gameState.mode === 'menu' ? (
                    <div className="max-w-2xl mx-auto">
                      <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 z-0"></div>
                        <CardHeader className="relative z-10">
                          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                            <Users className="w-6 h-6 text-green-500" />
                            Challenge Player
                          </CardTitle>
                          <CardDescription className="text-gray-700 dark:text-gray-200">
                            Challenge another wallet to a live chess match
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                          <div className="space-y-2">
                            <Label className="text-gray-800 dark:text-white font-medium">Opponent Wallet Address</Label>
                            <Input
                              placeholder="Enter wallet address..."
                              value={challengeWallet}
                              onChange={(e) => setChallengeWallet(e.target.value)}
                              className="bg-white/20 border-white/30 placeholder-gray-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-800 dark:text-white font-medium">Time Control</Label>
                            <Select 
                              value={`${gameState.timeControl.initial}-${gameState.timeControl.increment}`}
                              onValueChange={(value) => {
                                const [initial, increment] = value.split('-').map(Number)
                                setGameState(prev => ({
                                  ...prev,
                                  timeControl: { initial, increment }
                                }))
                              }}
                            >
                              <SelectTrigger className="bg-white/20 border-white/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="180-2">3+2 (Blitz)</SelectItem>
                                <SelectItem value="300-5">5+5 (Blitz)</SelectItem>
                                <SelectItem value="600-10">10+10 (Rapid)</SelectItem>
                                <SelectItem value="900-15">15+15 (Rapid)</SelectItem>
                                <SelectItem value="1800-30">30+30 (Classical)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={sendChallenge} 
                            disabled={!challengeWallet}
                            className="w-full bg-green-500 hover:bg-green-600"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send Challenge
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ) : gameState.mode === 'multiplayer' ? (
                    // Multiplayer Game in progress
                    <div className="grid lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                          <CardContent className="p-6">
                            <div className="aspect-square max-w-[600px] mx-auto">
                              <Chessboard
                                position={gameState.chess.fen()}
                                onSquareClick={onSquareClick}
                                arePiecesDraggable={false}
                                customSquareStyles={{
                                  ...(selectedSquare && {
                                    [selectedSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
                                  }),
                                  ...possibleMoves.reduce((styles, square) => ({
                                    ...styles,
                                    [square]: { backgroundColor: 'rgba(0, 255, 0, 0.4)' }
                                  }), {})
                                }}
                                boardOrientation={gameState.playerColor === 'b' ? 'black' : 'white'}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-6">
                        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                          <CardHeader>
                            <CardTitle className="text-gray-800 dark:text-white flex items-center gap-2">
                              <Users className="w-5 h-5 text-green-500" />
                              Multiplayer Game
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 dark:text-gray-200">Turn:</span>
                              <Badge variant={gameState.chess.turn() === 'w' ? 'default' : 'secondary'}>
                                {gameState.chess.turn() === 'w' ? 'White' : 'Black'}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 dark:text-gray-200">You:</span>
                              <Badge>
                                {gameState.playerColor === 'w' ? 'White' : 'Black'}
                              </Badge>
                            </div>
                            {gameState.opponent && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-200">Opponent:</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {gameState.opponent.wallet.slice(0, 8)}...
                                </span>
                              </div>
                            )}
                            <Button onClick={resetGame} variant="outline" className="w-full">
                              <X className="w-4 h-4 mr-2" />
                              Resign Game
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Challenges */}
                        {challenges.length > 0 && (
                          <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                            <CardHeader>
                              <CardTitle className="text-gray-800 dark:text-white">Incoming Challenges</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {challenges.map((challenge) => (
                                <div key={challenge.id} className="bg-white/20 p-3 rounded-lg space-y-2">
                                  <p className="text-sm text-gray-800 dark:text-white">
                                    From: {challenge.from.slice(0, 8)}...
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">
                                    Time: {formatTime(challenge.timeControl.initial)}+{challenge.timeControl.increment}s
                                  </p>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => acceptChallenge(challenge.id)}
                                      className="bg-green-500 hover:bg-green-600"
                                    >
                                      Accept
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => declineChallenge(challenge.id)}
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="leaderboard" className="space-y-6">
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Your Stats */}
                    <div className="lg:col-span-1">
                      <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="text-gray-800 dark:text-white flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Your Chess Stats
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {connected && chessStats ? (
                            <div className="space-y-4">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-purple-700 mb-1">
                                  {chessStats.elo_rating}
                                </div>
                                <div className="text-sm text-gray-600">ELO Rating</div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-center">
                                  <div className="font-bold text-lg">{chessStats.total_games}</div>
                                  <div className="text-gray-600">Games</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-lg text-green-600">{chessStats.wins}</div>
                                  <div className="text-gray-600">Wins</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-lg text-red-600">{chessStats.losses}</div>
                                  <div className="text-gray-600">Losses</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-lg text-yellow-600">{chessStats.draws}</div>
                                  <div className="text-gray-600">Draws</div>
                                </div>
                              </div>
                              
                              {chessStats.total_games > 0 && (
                                <div className="text-center pt-2 border-t border-white/20">
                                  <div className="text-sm text-gray-600">Win Rate</div>
                                  <div className="font-bold text-lg">
                                    {Math.round((chessStats.wins / chessStats.total_games) * 100)}%
                                  </div>
                                </div>
                              )}
                              
                              <Button 
                                onClick={loadChessStats} 
                                variant="outline" 
                                className="w-full"
                                disabled={loadingStats}
                              >
                                {loadingStats ? (
                                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent mr-2" />
                                ) : (
                                  <Award className="w-4 h-4 mr-2" />
                                )}
                                Refresh Stats
                              </Button>
                            </div>
                          ) : connected ? (
                            <div className="text-center py-8">
                              <div className="text-gray-600 mb-4">No games played yet</div>
                              <div className="text-2xl font-bold text-purple-700">1200</div>
                              <div className="text-sm text-gray-600">Starting ELO</div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-gray-600 mb-4">Connect wallet to view stats</div>
                              <WalletMultiButton className="!bg-purple-500 hover:!bg-purple-600" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Leaderboard */}
                    <div className="lg:col-span-2">
                      <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-gray-800 dark:text-white flex items-center gap-2">
                              <Trophy className="w-5 h-5 text-yellow-500" />
                              Chess Leaderboard
                            </CardTitle>
                            <CardDescription className="text-gray-700 dark:text-gray-200">
                              Top players by ELO rating
                            </CardDescription>
                          </div>
                          <Button 
                            onClick={loadLeaderboard}
                            variant="outline"
                            size="sm"
                            disabled={loadingLeaderboard}
                          >
                            {loadingLeaderboard ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                            ) : (
                              "Refresh"
                            )}
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {loadingLeaderboard ? (
                            <div className="space-y-3">
                              {[...Array(10)].map((_, i) => (
                                <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-white/10 rounded-lg">
                                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                                  <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : leaderboard.length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {leaderboard.map((player, index) => (
                                <div 
                                  key={player.wallet_address} 
                                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                                    connected && player.wallet_address === publicKey?.toString() 
                                      ? 'bg-purple-500/20 border border-purple-400/30' 
                                      : 'bg-white/10 hover:bg-white/20'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                    index === 1 ? 'bg-gray-400 text-gray-900' :
                                    index === 2 ? 'bg-orange-500 text-orange-900' :
                                    'bg-gray-600 text-white'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-800 dark:text-white">
                                        {player.wallet_address.slice(0, 6)}...{player.wallet_address.slice(-4)}
                                        {connected && player.wallet_address === publicKey?.toString() && (
                                          <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-1 rounded">YOU</span>
                                        )}
                                      </span>
                                      <span className="font-bold text-purple-700">
                                        {player.elo_rating}
                                      </span>
                                    </div>
                                                                         <div className="text-xs text-gray-600 dark:text-gray-400">
                                       {player.total_games} games • {player.wins}W {player.losses}L {player.draws}D
                                       {player.total_games > 0 && (
                                         <span className="ml-2">
                                           ({Math.round((player.wins / player.total_games) * 100)}% win rate)
                                         </span>
                                       )}
                                     </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-600">
                              No players on the leaderboard yet. Be the first to play!
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </div>

      {/* Feedback Form */}
      <FeedbackForm 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </div>
  )
} 