export interface StockfishMove {
  from: string
  to: string
  promotion?: string
}

export interface StockfishEvaluation {
  depth: number
  score: number // centipawns
  mate?: number // moves to mate
  bestMove: string
  pv: string[] // principal variation
}

export class StockfishEngine {
  private isReady = false
  private difficulty = 3
  private thinkingTime = 1000 // milliseconds
  private isClient = false
  private apiUrl = 'https://stockfish.online/api/s/v2.php'

  constructor() {
    // Only initialize on client side
    this.isClient = typeof window !== 'undefined'
    if (this.isClient) {
      this.initializeEngine()
    }
  }

  private async initializeEngine() {
    if (!this.isClient) {
      console.warn('Stockfish can only be initialized on client side')
      return
    }

    try {
      // Test API connectivity using GET request with URL parameters
      const testUrl = `${this.apiUrl}?fen=${encodeURIComponent('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')}&depth=1`
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          this.isReady = true
          console.log('Stockfish API connected successfully')
        } else {
          throw new Error('API test failed')
        }
      } else {
        throw new Error('API connection failed')
      }
    } catch (error) {
      console.error('Failed to connect to Stockfish API:', error)
      this.isReady = false
    }
  }

  private parseMove(moveStr: string): StockfishMove {
    return {
      from: moveStr.substring(0, 2),
      to: moveStr.substring(2, 4),
      promotion: moveStr.length > 4 ? moveStr.substring(4, 5) : undefined
    }
  }

  setDifficulty(level: number) {
    if (!this.isClient) return

    this.difficulty = Math.max(1, Math.min(5, level))
    
    // Map difficulty to search depth and thinking time
    const depths = [1, 3, 5, 8, 12] // Search depths
    const times = [100, 300, 500, 1000, 2000] // Thinking times

    this.thinkingTime = times[this.difficulty - 1]
    console.log(`Difficulty set to ${level}, depth will be ${depths[this.difficulty - 1]}`)
  }

  setPosition(fen: string, moves: string[] = []) {
    // This will be handled in getBestMove
    console.log('Position set:', fen)
  }

  setStartPosition(moves: string[] = []) {
    // This will be handled in getBestMove
    console.log('Start position set with moves:', moves)
  }

  async getBestMove(fen?: string): Promise<StockfishMove | null> {
    if (!this.isClient || !this.isReady) {
      console.warn('Stockfish API not ready')
      return null
    }

    // Use provided FEN or default starting position
    const position = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    
    // Map difficulty to depth
    const depths = [1, 3, 5, 8, 12]
    const depth = depths[this.difficulty - 1]

    try {
      console.log(`Getting best move for position: ${position} at depth ${depth}`)
      
      // Use GET request with URL parameters as per API documentation
      const url = `${this.apiUrl}?fen=${encodeURIComponent(position)}&depth=${depth}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('Stockfish API response:', data)

      if (data.success && data.bestmove) {
        // Extract the actual move from the bestmove string
        // Format is usually "bestmove e2e4 ponder ..." - we want just "e2e4"
        const moveMatch = data.bestmove.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/)
        if (moveMatch) {
          const moveStr = moveMatch[1]
          const move = this.parseMove(moveStr)
          console.log('Best move found:', move)
          return move
        } else {
          console.error('Could not parse move from:', data.bestmove)
          return null
        }
      } else {
        console.error('API returned no valid move:', data)
        return null
      }
    } catch (error) {
      console.error('Error getting best move:', error)
      return null
    }
  }

  async getEvaluation(fen?: string): Promise<StockfishEvaluation | null> {
    if (!this.isClient || !this.isReady) {
      return null
    }

    // Use provided FEN or default starting position
    const position = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const depth = Math.max(5, this.difficulty * 2)

    try {
      // Use GET request with URL parameters as per API documentation
      const url = `${this.apiUrl}?fen=${encodeURIComponent(position)}&depth=${depth}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        return {
          depth: depth,
          score: data.evaluation || 0,
          mate: data.mate || undefined,
          bestMove: data.bestmove || '',
          pv: data.continuation ? data.continuation.split(' ') : []
        }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting evaluation:', error)
      return null
    }
  }

  stop() {
    // API calls can't be stopped mid-request, but we can ignore results
    console.log('Stop requested (API calls cannot be cancelled)')
  }

  quit() {
    // Nothing to clean up for API-based implementation
    this.isReady = false
    console.log('Stockfish API connection closed')
  }

  isEngineReady(): boolean {
    return this.isClient && this.isReady
  }
} 