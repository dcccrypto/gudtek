# GudTek Chess Server

A real-time multiplayer chess server built with Node.js, Express, and Socket.IO for the GudTek chess platform.

## Features

- ✅ **Real-time multiplayer chess** via WebSocket connections
- ✅ **Wallet-based authentication** (Solana wallet addresses)
- ✅ **Challenge system** with rate limiting (one challenge per user)
- ✅ **Game state management** with time controls
- ✅ **CORS protection** with environment-based origins
- ✅ **Rate limiting** and security headers
- ✅ **Health check endpoint** for monitoring
- ✅ **Automatic cleanup** of expired challenges and disconnected games

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   ```bash
   # Edit .env file with your settings
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server:**
   ```bash
   npm run dev  # Development with nodemon
   # or
   npm start    # Production
   ```

5. **Verify it's running:**
   - Server: `http://localhost:3001`
   - Health check: `http://localhost:3001/health`

## Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Development frontend URL | `http://localhost:3000` |
| `FRONTEND_URL_PROD` | Production frontend URL | `https://your-domain.com` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## Railway Deployment

### 1. Prepare for Deployment

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add chess server"
   git push origin main
   ```

### 2. Deploy to Railway

1. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `server` folder as root

2. **Set Environment Variables:**
   ```bash
   NODE_ENV=production
   FRONTEND_URL_PROD=https://your-frontend-domain.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Deploy:**
   - Railway will automatically build and deploy
   - Your server will be available at: `https://your-app.up.railway.app`

### 3. Update Frontend Configuration

Update your frontend `.env.local`:
```bash
NEXT_PUBLIC_CHESS_SERVER_URL_PROD=wss://your-app.up.railway.app
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and current connections:
```json
{
  "status": "ok",
  "games": 0,
  "challenges": 0,
  "activeChallenges": 0,
  "users": 0
}
```

## WebSocket Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `send-challenge` | `{to: wallet, timeControl: {initial, increment}}` | Send challenge to user |
| `accept-challenge` | `challengeId` | Accept a received challenge |
| `decline-challenge` | `challengeId` | Decline a received challenge |
| `make-move` | `{gameId, move}` | Make a chess move |
| `end-game` | `{gameId, reason, winner}` | End game (resign, etc.) |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `authenticated` | `{wallet, timestamp}` | Wallet authentication confirmed |
| `challenge-received` | `challenge` | New challenge received |
| `challenge-accepted` | `gameId, opponent, color` | Challenge was accepted |
| `challenge-declined` | `challengeId` | Challenge was declined |
| `game-move` | `move` | Opponent made a move |
| `game-end` | `winner, reason` | Game ended |
| `opponent-disconnected` | - | Opponent left the game |
| `error` | `message` | Error occurred |

## Authentication & Security

### Current Authentication
- **Wallet-based:** Uses Solana wallet addresses passed via WebSocket query
- **No JWT/sessions:** Simple wallet address verification
- **Rate limiting:** One active challenge per user
- **CORS protection:** Environment-based allowed origins

### Security Features
- ✅ Helmet.js for security headers
- ✅ Rate limiting on health endpoint
- ✅ CORS with environment-specific origins
- ✅ Input validation for wallet addresses
- ✅ Automatic cleanup of expired data

### Security Limitations
⚠️ **Note:** This is a basic implementation suitable for a gaming platform. For production financial applications, consider:

- JWT token authentication
- Database-backed session management
- User roles and permissions
- Input sanitization and validation
- Logging and monitoring
- DDoS protection

## Game Flow

1. **Connection:** Client connects with wallet address in query
2. **Authentication:** Server validates wallet and confirms connection
3. **Challenge:** User sends challenge to another wallet address
4. **Acceptance:** Target user accepts/declines the challenge
5. **Game Start:** Server creates game instance and notifies both players
6. **Gameplay:** Players make moves via WebSocket events
7. **Game End:** Game ends by checkmate, resignation, or disconnection

## Monitoring

### Health Check
Monitor your deployment:
```bash
curl https://your-app.up.railway.app/health
```

### Logs
Check Railway logs for:
- Connection events
- Game creation/completion
- Challenge activity
- Error messages

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Verify `FRONTEND_URL_PROD` matches your frontend domain
   - Check allowed origins in server logs

2. **WebSocket Connection Failed:**
   - Ensure using `wss://` for HTTPS sites
   - Check firewall/proxy settings

3. **Rate Limiting:**
   - Adjust `RATE_LIMIT_MAX_REQUESTS` if needed
   - Check if IP is being rate limited

4. **Authentication Errors:**
   - Verify wallet address format
   - Check WebSocket query parameters

### Development

```bash
# Run with detailed logging
DEBUG=* npm run dev

# Check connections
curl http://localhost:3001/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 