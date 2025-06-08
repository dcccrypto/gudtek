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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_is_read ON feedback(is_read);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

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

-- Insert some demo data
INSERT INTO announcements (title, message, type, priority, is_active, expires_at) VALUES
  ('🎉 Welcome to Gud Tek!', 'The #1 BONK Hackathon Winner is now live! Join our community and experience revolutionary DeFi on Solana.', 'announcement', 1, true, NOW() + INTERVAL '7 days'),
  ('🚀 Community Growth Update', 'Our community has reached 1,000+ members! Thank you for being part of the Gud Tek revolution. More exciting features coming soon.', 'success', 5, true, NOW() + INTERVAL '5 days'),
  ('ℹ️ Trading Information', 'Gud Tek ($GUDTEK) is now available on Jupiter! Start trading with low fees and fast transactions on Solana.', 'info', 3, true, NULL),
  ('⚠️ Important: Verify Contract Address', 'Always verify our official contract address before trading: 5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk. Beware of scams!', 'warning', 2, true, NULL)
ON CONFLICT DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();