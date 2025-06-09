-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'announcement')),
  priority INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  image_url TEXT,
  image_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game users table (for holder verification)
CREATE TABLE IF NOT EXISTS game_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  token_balance DECIMAL NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  username TEXT,
  last_balance_check TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game sessions table (for anti-cheat)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES game_users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  score INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  tokens_collected INTEGER NOT NULL,
  obstacles_hit INTEGER NOT NULL,
  session_hash TEXT NOT NULL, -- For verification
  ip_address INET,
  user_agent TEXT,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leaderboard table (optimized for queries)
CREATE TABLE IF NOT EXISTS game_leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES game_users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  username TEXT,
  high_score INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  total_tokens_collected INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create game achievements table
CREATE TABLE IF NOT EXISTS game_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES game_users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Create game settings table (for admin control)
CREATE TABLE IF NOT EXISTS game_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_is_read ON feedback(is_read);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Game indexes
CREATE INDEX IF NOT EXISTS idx_game_users_wallet ON game_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_game_users_verified ON game_users(is_verified, is_banned);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created ON game_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_game_leaderboard_score ON game_leaderboard(high_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_leaderboard_rank ON game_leaderboard(rank_position);
CREATE INDEX IF NOT EXISTS idx_game_achievements_user ON game_achievements(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements
-- Allow public read access to active announcements
CREATE POLICY "Public can view active announcements" ON announcements
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to manage announcements (you can customize this)
CREATE POLICY "Authenticated users can manage announcements" ON announcements
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for feedback
-- Allow public to insert feedback
CREATE POLICY "Public can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view and manage feedback
CREATE POLICY "Authenticated users can manage feedback" ON feedback
  FOR ALL USING (auth.role() = 'authenticated');

-- Game policies
-- Allow public read access to game users and leaderboard
CREATE POLICY "Public can view game users" ON game_users
  FOR SELECT USING (true);

CREATE POLICY "Public can insert game users" ON game_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update own game user" ON game_users
  FOR UPDATE USING (true);

CREATE POLICY "Public can view leaderboard" ON game_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Public can insert leaderboard" ON game_leaderboard
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update leaderboard" ON game_leaderboard
  FOR UPDATE USING (true);

CREATE POLICY "Public can insert game sessions" ON game_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view game sessions" ON game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Public can view achievements" ON game_achievements
  FOR SELECT USING (true);

CREATE POLICY "Public can insert achievements" ON game_achievements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view game settings" ON game_settings
  FOR SELECT USING (true);

-- Admin policies (authenticated users can manage game settings)
CREATE POLICY "Authenticated users can manage game settings" ON game_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert some demo data
INSERT INTO announcements (title, message, type, priority, is_active, expires_at) VALUES
  ('🎉 Welcome to Gud Tek!', 'The #1 BONK Hackathon Winner is now live! Join our community and experience revolutionary DeFi on Solana.', 'announcement', 1, true, NOW() + INTERVAL '7 days'),
  ('🚀 Community Growth Update', 'Our community has reached 1,000+ members! Thank you for being part of the Gud Tek revolution. More exciting features coming soon.', 'success', 5, true, NOW() + INTERVAL '5 days'),
  ('ℹ️ Trading Information', 'Gud Tek ($GUDTEK) is now available on Jupiter! Start trading with low fees and fast transactions on Solana.', 'info', 3, true, NULL),
  ('⚠️ Important: Verify Contract Address', 'Always verify our official contract address before trading: 5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk. Beware of scams!', 'warning', 2, true, NULL)
ON CONFLICT DO NOTHING;

-- Insert default game settings
INSERT INTO game_settings (setting_key, setting_value, description) VALUES
  ('min_token_balance', '1000', 'Minimum token balance required to play'),
  ('game_enabled', 'true', 'Whether the game is currently enabled'),
  ('max_score_per_session', '10000', 'Maximum score allowed per session (anti-cheat)'),
  ('leaderboard_size', '100', 'Number of top players to show in leaderboard'),
  ('token_contract_address', '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk', 'Official token contract address'),
  ('daily_game_limit', '50', 'Maximum games per user per day')
ON CONFLICT (setting_key) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update leaderboard ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rank positions based on high scores
    WITH ranked_users AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY high_score DESC, updated_at ASC) as new_rank
        FROM game_leaderboard
    )
    UPDATE game_leaderboard 
    SET rank_position = ranked_users.new_rank,
        updated_at = NOW()
    FROM ranked_users 
    WHERE game_leaderboard.id = ranked_users.id;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_users_updated_at BEFORE UPDATE ON game_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_leaderboard_updated_at BEFORE UPDATE ON game_leaderboard
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_settings_updated_at BEFORE UPDATE ON game_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update leaderboard ranks after score updates
CREATE TRIGGER update_leaderboard_ranks_trigger AFTER INSERT OR UPDATE ON game_leaderboard
    FOR EACH STATEMENT EXECUTE FUNCTION update_leaderboard_ranks();