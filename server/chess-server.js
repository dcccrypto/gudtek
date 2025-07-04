require('dotenv').config()
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

const app = express()
const server = http.createServer(app)

// Environment variables with defaults
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gudtek.club'
const FRONTEND_URL_PROD = process.env.FRONTEND_URL_PROD || 'https://gudtek-82ta.vercel.app'

// Configure allowed origins based on environment
const allowedOrigins = NODE_ENV === 'production' 
  ? [FRONTEND_URL_PROD, FRONTEND_URL, 'https://gudtek-82ta.vercel.app', 'https://www.gudtek.com', 'https://gudtek.com']
  : [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000']

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disable CSP for WebSocket connections
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/health', limiter)

// Configure CORS for both Express and Socket.IO
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}))

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
})

// In-memory storage (in production, use Redis or database)
const games = new Map()
const challenges = new Map()
const connectedUsers = new Map()
const activeChallenges = new Map() // Track active challenges per user

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15)

// Game logic
class ChessGame {
  constructor(player1, player2, timeControl) {
    this.id = generateId()
    this.players = {
      white: Math.random() > 0.5 ? player1 : player2,
      black: Math.random() > 0.5 ? player1 : player2
    }
    // Ensure different colors
    if (this.players.white === this.players.black) {
      this.players.black = player1 === this.players.white ? player2 : player1
    }
    
    this.timeControl = timeControl
    this.playerTime = {
      white: timeControl.initial,
      black: timeControl.initial
    }
    this.currentTurn = 'white'
    this.moves = []
    this.status = 'active'
    this.lastMoveTime = Date.now()
  }
  
  makeMove(move, player) {
    // Validate it's player's turn
    const playerColor = this.players.white === player ? 'white' : 'black'
    if (this.currentTurn !== playerColor) {
      return { success: false, error: 'Not your turn' }
    }
    
    // Add time increment and subtract elapsed time
    const now = Date.now()
    const elapsed = Math.floor((now - this.lastMoveTime) / 1000)
    
    this.playerTime[playerColor] = Math.max(0, 
      this.playerTime[playerColor] - elapsed + this.timeControl.increment
    )
    
    // Check time loss
    if (this.playerTime[playerColor] <= 0) {
      this.status = 'finished'
      this.winner = playerColor === 'white' ? 'black' : 'white'
      this.endReason = 'timeout'
      return { success: true, gameEnded: true, winner: this.winner, reason: 'timeout' }
    }
    
    this.moves.push(move)
    this.currentTurn = playerColor === 'white' ? 'black' : 'white'
    this.lastMoveTime = now
    
    return { success: true }
  }
  
  endGame(winner, reason = 'checkmate') {
    this.status = 'finished'
    this.winner = winner
    this.endReason = reason
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)
  
  // Store user info from handshake query
  const wallet = socket.handshake.query.wallet
  if (wallet && typeof wallet === 'string') {
    connectedUsers.set(socket.id, { wallet, socketId: socket.id })
    console.log(`Wallet ${wallet.slice(0, 8)}...${wallet.slice(-4)} connected`)
    
    // Send connection confirmation
    socket.emit('authenticated', { wallet, timestamp: Date.now() })
  } else {
    console.log(`Connection without valid wallet: ${socket.id}`)
    socket.emit('error', 'Wallet authentication required')
  }
  
  // Handle challenge sending
  socket.on('send-challenge', (data) => {
    const { to, timeControl } = data
    const fromWallet = connectedUsers.get(socket.id)?.wallet
    
    if (!fromWallet) {
      socket.emit('error', 'Wallet not connected')
      return
    }
    
    // Check if user already has an active challenge
    if (activeChallenges.has(fromWallet)) {
      socket.emit('error', 'You can only have one active challenge at a time. Please wait for your current challenge to be accepted or declined.')
      return
    }
    
    // Check if challenging themselves
    if (fromWallet === to) {
      socket.emit('error', 'You cannot challenge yourself')
      return
    }
    
    // Find target user
    const targetUser = Array.from(connectedUsers.values()).find(user => user.wallet === to)
    if (!targetUser) {
      socket.emit('error', 'User not online')
      return
    }
    
    const challengeId = generateId()
    const challenge = {
      id: challengeId,
      from: fromWallet,
      to,
      timeControl,
      timestamp: Date.now()
    }
    
    challenges.set(challengeId, challenge)
    activeChallenges.set(fromWallet, challengeId) // Track active challenge
    
    // Send challenge to target user
    io.to(targetUser.socketId).emit('challenge-received', challenge)
    
    console.log(`Challenge sent from ${fromWallet} to ${to}`)
  })
  
  // Handle challenge acceptance
  socket.on('accept-challenge', (challengeId) => {
    const challenge = challenges.get(challengeId)
    if (!challenge) {
      socket.emit('error', 'Challenge not found')
      return
    }
    
    const accepterWallet = connectedUsers.get(socket.id)?.wallet
    if (!accepterWallet || accepterWallet !== challenge.to) {
      socket.emit('error', 'Unauthorized')
      return
    }
    
    // Create game
    const game = new ChessGame(challenge.from, challenge.to, challenge.timeControl)
    games.set(game.id, game)
    
    // Notify both players
    const challengerUser = Array.from(connectedUsers.values()).find(user => user.wallet === challenge.from)
    const accepterUser = Array.from(connectedUsers.values()).find(user => user.wallet === challenge.to)
    
    if (challengerUser && accepterUser) {
      const challengerColor = game.players.white === challenge.from ? 'w' : 'b'
      const accepterColor = challengerColor === 'w' ? 'b' : 'w'
      
      io.to(challengerUser.socketId).emit('challenge-accepted', game.id, challenge.to, challengerColor)
      io.to(accepterUser.socketId).emit('challenge-accepted', game.id, challenge.from, accepterColor)
      
      console.log(`Game ${game.id} started between ${challenge.from} and ${challenge.to}`)
    }
    
    // Remove challenge and clear active challenge tracking
    challenges.delete(challengeId)
    activeChallenges.delete(challenge.from)
  })
  
  // Handle challenge decline
  socket.on('decline-challenge', (challengeId) => {
    const challenge = challenges.get(challengeId)
    if (!challenge) return
    
    const declinerWallet = connectedUsers.get(socket.id)?.wallet
    if (declinerWallet !== challenge.to) return
    
    // Notify challenger
    const challengerUser = Array.from(connectedUsers.values()).find(user => user.wallet === challenge.from)
    if (challengerUser) {
      io.to(challengerUser.socketId).emit('challenge-declined', challengeId)
    }
    
    challenges.delete(challengeId)
    activeChallenges.delete(challenge.from) // Clear active challenge tracking
    console.log(`Challenge ${challengeId} declined`)
  })
  
  // Handle game moves (legacy challenge system)
  socket.on('make-move', (data) => {
    const { gameId, move } = data
    const game = games.get(gameId)
    
    if (!game) {
      socket.emit('error', 'Game not found')
      return
    }
    
    const playerWallet = connectedUsers.get(socket.id)?.wallet
    if (!playerWallet || (playerWallet !== game.players.white && playerWallet !== game.players.black)) {
      socket.emit('error', 'Not a player in this game')
      return
    }
    
    const result = game.makeMove(move, playerWallet)
    if (!result.success) {
      socket.emit('error', result.error)
      return
    }
    
    // Broadcast move to opponent
    const opponentWallet = playerWallet === game.players.white ? game.players.black : game.players.white
    const opponentUser = Array.from(connectedUsers.values()).find(user => user.wallet === opponentWallet)
    
    if (opponentUser) {
      io.to(opponentUser.socketId).emit('game-move', move)
    }
    
    // Check if game ended
    if (result.gameEnded) {
      const players = [game.players.white, game.players.black]
      players.forEach(wallet => {
        const user = Array.from(connectedUsers.values()).find(u => u.wallet === wallet)
        if (user) {
          io.to(user.socketId).emit('game-end', result.winner, result.reason)
        }
      })
      
      games.delete(gameId)
      console.log(`Game ${gameId} ended. Winner: ${result.winner}`)
    }
  })
  
  // Handle lobby-based game moves (new system)
  socket.on('lobby-move', (data) => {
    const { gameId, move, from, to, fen } = data
    const fromWallet = connectedUsers.get(socket.id)?.wallet
    
    console.log(`🎯 Lobby move received:`, {
      gameId,
      move,
      from,
      to,
      fromWallet,
      socketId: socket.id,
      connectedUsersCount: connectedUsers.size
    })
    
    if (!fromWallet || fromWallet !== from) {
      console.error(`❌ Unauthorized move attempt:`, {
        fromWallet,
        expectedFrom: from,
        socketId: socket.id
      })
      socket.emit('error', 'Unauthorized move attempt')
      return
    }
    
    console.log(`🔍 Looking for target user: ${to}`)
    console.log(`📋 Connected users:`, Array.from(connectedUsers.values()).map(u => ({
      wallet: u.wallet.slice(0, 8) + '...',
      socketId: u.socketId
    })))
    
    // Find ALL target user sockets with exact wallet match
    const targetUsers = Array.from(connectedUsers.values()).filter(user => {
      const match = user.wallet === to
      console.log(`🔎 Checking ${user.wallet.slice(0, 8)}... === ${to.slice(0, 8)}...: ${match}`)
      return match
    })

    if (targetUsers.length === 0) {
      console.error(`❌ Target user ${to.slice(0, 8)}... not found online`)
      console.log(`🔍 Available users:`, Array.from(connectedUsers.values()).map(u => u.wallet.slice(0, 8) + '...'))
      socket.emit('error', 'Opponent not online')
      return
    }

    // Prepare move payload
    const moveData = {
      gameId,
      move,
      from,
      fen
    }

    // Send move to all sockets belonging to the opponent wallet
    targetUsers.forEach(user => {
      console.log(`📡 Sending lobby-move-received to ${user.socketId}:`, moveData)
      io.to(user.socketId).emit('lobby-move-received', moveData)
    })

    console.log(`✅ Move ${move} sent from ${from.slice(0, 8)}... to ${to.slice(0, 8)}... (${targetUsers.length} socket(s))`)
  })
  
  // Handle game end (resignation, draw offer, etc.)
  socket.on('end-game', (data) => {
    const { gameId, reason, winner } = data
    const game = games.get(gameId)
    
    if (!game) return
    
    const playerWallet = connectedUsers.get(socket.id)?.wallet
    if (!playerWallet || (playerWallet !== game.players.white && playerWallet !== game.players.black)) {
      return
    }
    
    game.endGame(winner, reason)
    
    // Notify both players
    const players = [game.players.white, game.players.black]
    players.forEach(wallet => {
      const user = Array.from(connectedUsers.values()).find(u => u.wallet === wallet)
      if (user) {
        io.to(user.socketId).emit('game-end', winner, reason)
      }
    })
    
    games.delete(gameId)
    console.log(`Game ${gameId} ended by player. Reason: ${reason}`)
  })
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      console.log(`👋 User ${user.wallet.slice(0, 8)}...${user.wallet.slice(-4)} disconnected`)
      
      // Clean up any active challenges from this user
      activeChallenges.delete(user.wallet)
      
      // Find any active games with this user
      for (const [gameId, game] of games.entries()) {
        if (game.players.white === user.wallet || game.players.black === user.wallet) {
          const opponentWallet = game.players.white === user.wallet ? game.players.black : game.players.white
          const opponentUser = Array.from(connectedUsers.values()).find(u => u.wallet === opponentWallet)
          
          if (opponentUser) {
            io.to(opponentUser.socketId).emit('opponent-disconnected')
          }
          
          games.delete(gameId)
          console.log(`Game ${gameId} ended due to disconnection`)
        }
      }
      
      connectedUsers.delete(socket.id)
      console.log(`📊 Remaining connected users: ${connectedUsers.size}`)
    } else {
      console.log(`❓ Unknown user disconnected: ${socket.id}`)
    }
  })
})

// Basic API endpoint for health check
app.get('/health', (req, res) => {
  const connectedUsersList = Array.from(connectedUsers.values()).map(user => ({
    wallet: user.wallet.slice(0, 8) + '...' + user.wallet.slice(-4),
    socketId: user.socketId
  }))
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    games: games.size,
    challenges: challenges.size,
    activeChallenges: activeChallenges.size,
    users: connectedUsers.size,
    connectedUsers: connectedUsersList,
    uptime: process.uptime()
  })
})

// Debug endpoint for connected users
app.get('/debug/users', (req, res) => {
  const users = Array.from(connectedUsers.entries()).map(([socketId, user]) => ({
    socketId,
    wallet: user.wallet,
    connected: io.sockets.sockets.has(socketId)
  }))
  
  res.json({
    total: connectedUsers.size,
    users
  })
})

// Test endpoint to send test events to specific users
app.post('/debug/test-event/:wallet', (req, res) => {
  const { wallet } = req.params
  const { message = 'Test message from server' } = req.body
  
  console.log(`🧪 Test event requested for wallet: ${wallet.slice(0, 8)}...`)
  
  // Find user by wallet
  const targetUser = Array.from(connectedUsers.values()).find(user => user.wallet === wallet)
  
  if (!targetUser) {
    console.log(`❌ User ${wallet.slice(0, 8)}... not found for test`)
    return res.status(404).json({ error: 'User not found or not connected' })
  }
  
  console.log(`✅ Sending test event to ${targetUser.wallet.slice(0, 8)}... (${targetUser.socketId})`)
  
  // Send test event
  io.to(targetUser.socketId).emit('test-event', {
    message,
    timestamp: Date.now(),
    from: 'server'
  })
  
  res.json({ 
    success: true, 
    sentTo: {
      wallet: targetUser.wallet.slice(0, 8) + '...',
      socketId: targetUser.socketId
    },
    message 
  })
})

// Test endpoint to verify lobby-move functionality
app.post('/debug/test-lobby-move', (req, res) => {
  const { fromWallet, toWallet, gameId, move = 'e4' } = req.body
  
  if (!fromWallet || !toWallet || !gameId) {
    return res.status(400).json({ error: 'Missing required fields: fromWallet, toWallet, gameId' })
  }
  
  console.log(`🧪 Test lobby move: ${fromWallet.slice(0, 8)}... -> ${toWallet.slice(0, 8)}...`)
  
  // Find target user
  const targetUser = Array.from(connectedUsers.values()).find(user => user.wallet === toWallet)
  
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found or not connected' })
  }
  
  // Send test lobby move
  const testMoveData = {
    gameId,
    move,
    from: fromWallet,
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
  }
  
  console.log(`📡 Sending test lobby-move-received:`, testMoveData)
  io.to(targetUser.socketId).emit('lobby-move-received', testMoveData)
  
  res.json({ 
    success: true, 
    testMove: testMoveData,
    sentTo: {
      wallet: targetUser.wallet.slice(0, 8) + '...',
      socketId: targetUser.socketId
    }
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Chess WebSocket server running on port ${PORT}`)
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`)
  console.log(`🔧 Debug endpoint at http://localhost:${PORT}/debug/users`)
  console.log(`🌍 Environment: ${NODE_ENV}`)
  console.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`)
  console.log(`⏰ Server started at: ${new Date().toISOString()}`)
})

// Enhanced cleanup interval for expired challenges and stale connections
setInterval(() => {
  const now = Date.now()
  
  // Clean up expired challenges
  for (const [challengeId, challenge] of challenges.entries()) {
    if (now - challenge.timestamp > 5 * 60 * 1000) { // 5 minutes
      challenges.delete(challengeId)
      activeChallenges.delete(challenge.from)
      console.log(`🧹 Expired challenge ${challengeId} removed`)
    }
  }
  
  // Clean up stale user connections
  let staleConnections = 0
  for (const [socketId, user] of connectedUsers.entries()) {
    if (!io.sockets.sockets.has(socketId)) {
      connectedUsers.delete(socketId)
      staleConnections++
      console.log(`🧹 Removed stale connection for ${user.wallet.slice(0, 8)}...`)
    }
  }
  
  if (staleConnections > 0) {
    console.log(`🧹 Cleaned up ${staleConnections} stale connections`)
  }
  
  console.log(`📊 Server status: ${connectedUsers.size} users, ${games.size} games, ${challenges.size} challenges`)
}, 60000) // Check every minute 