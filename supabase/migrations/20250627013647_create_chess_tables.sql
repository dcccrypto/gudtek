-- Create chess_games table
CREATE TABLE IF NOT EXISTS chess_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_white TEXT NOT NULL,
  player_black TEXT NOT NULL,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('ai', 'multiplayer')),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  winner TEXT CHECK (winner IN ('white', 'black', 'draw')),
  pgn TEXT NOT NULL DEFAULT '',
  final_position TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  time_control INTEGER NOT NULL DEFAULT 600,
  white_time_left INTEGER NOT NULL DEFAULT 600,
  black_time_left INTEGER NOT NULL DEFAULT 600,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chess_moves table  
CREATE TABLE IF NOT EXISTS chess_moves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES chess_games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  player TEXT NOT NULL CHECK (player IN ('white', 'black')),
  move_san TEXT NOT NULL,
  move_uci TEXT NOT NULL,
  position_fen TEXT NOT NULL,
  time_taken INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chess_stats table for player statistics
CREATE TABLE IF NOT EXISTS chess_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  total_games INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  elo_rating INTEGER NOT NULL DEFAULT 1200,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  total_time_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chess_games_players ON chess_games(player_white, player_black);
CREATE INDEX IF NOT EXISTS idx_chess_games_status ON chess_games(status);
CREATE INDEX IF NOT EXISTS idx_chess_games_created_at ON chess_games(created_at);
CREATE INDEX IF NOT EXISTS idx_chess_moves_game_id ON chess_moves(game_id);
CREATE INDEX IF NOT EXISTS idx_chess_moves_move_number ON chess_moves(move_number);
CREATE INDEX IF NOT EXISTS idx_chess_stats_wallet ON chess_stats(wallet_address);
CREATE INDEX IF NOT EXISTS idx_chess_stats_elo ON chess_stats(elo_rating DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE chess_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for chess tables
-- Allow public read access to chess games and moves
CREATE POLICY "Public can view chess games" ON chess_games
  FOR SELECT USING (true);

CREATE POLICY "Public can insert chess games" ON chess_games
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update chess games" ON chess_games
  FOR UPDATE USING (true);

CREATE POLICY "Public can view chess moves" ON chess_moves
  FOR SELECT USING (true);

CREATE POLICY "Public can insert chess moves" ON chess_moves
  FOR INSERT WITH CHECK (true);

-- Chess stats policies
CREATE POLICY "Public can view chess stats" ON chess_stats
  FOR SELECT USING (true);

CREATE POLICY "Public can insert chess stats" ON chess_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update chess stats" ON chess_stats
  FOR UPDATE USING (true);

-- Create updated_at trigger for chess tables
CREATE TRIGGER update_chess_games_updated_at BEFORE UPDATE ON chess_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chess_stats_updated_at BEFORE UPDATE ON chess_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 