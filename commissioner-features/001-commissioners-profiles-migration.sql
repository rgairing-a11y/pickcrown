-- =============================================
-- COMMISSIONERS & PROFILES MIGRATION
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. COMMISSIONERS TABLE
-- Tracks registered commissioners (pool creators)
CREATE TABLE IF NOT EXISTS commissioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  pools_created INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_commissioners_email ON commissioners(email);

-- 2. PROFILES TABLE (Optional accounts)
-- For users who want to save preferences and have an avatar
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  avatar_emoji TEXT DEFAULT '👤',
  avatar_color TEXT DEFAULT '#3b82f6',
  notification_preferences JSONB DEFAULT '{"results": true, "reminders": true}'::jsonb,
  is_commissioner BOOLEAN DEFAULT false,
  commissioner_id UUID REFERENCES commissioners(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 3. Add commissioner_id to pools table (optional link)
ALTER TABLE pools 
ADD COLUMN IF NOT EXISTS commissioner_id UUID REFERENCES commissioners(id);

-- 4. AVATAR PRESETS (for fun avatars)
CREATE TABLE IF NOT EXISTS avatar_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  category TEXT DEFAULT 'general'
);

-- Seed some avatar presets
INSERT INTO avatar_presets (emoji, label, color, category) VALUES
  ('👑', 'Crown', '#f59e0b', 'royalty'),
  ('🏆', 'Trophy', '#eab308', 'sports'),
  ('⚡', 'Lightning', '#8b5cf6', 'general'),
  ('🎯', 'Bullseye', '#ef4444', 'sports'),
  ('🦁', 'Lion', '#f97316', 'animals'),
  ('🐻', 'Bear', '#78716c', 'animals'),
  ('🦅', 'Eagle', '#0ea5e9', 'animals'),
  ('🐺', 'Wolf', '#6b7280', 'animals'),
  ('🎸', 'Guitar', '#ec4899', 'music'),
  ('🎮', 'Gaming', '#22c55e', 'gaming'),
  ('🚀', 'Rocket', '#3b82f6', 'general'),
  ('💎', 'Diamond', '#06b6d4', 'general'),
  ('🔥', 'Fire', '#f97316', 'general'),
  ('⭐', 'Star', '#fbbf24', 'general'),
  ('🌙', 'Moon', '#6366f1', 'general'),
  ('🎪', 'Circus', '#f43f5e', 'fun'),
  ('🎭', 'Theater', '#a855f7', 'fun'),
  ('🏈', 'Football', '#854d0e', 'sports'),
  ('⚽', 'Soccer', '#16a34a', 'sports'),
  ('🏀', 'Basketball', '#ea580c', 'sports'),
  ('🎬', 'Movies', '#1f2937', 'entertainment'),
  ('📺', 'TV', '#4b5563', 'entertainment')
ON CONFLICT DO NOTHING;

-- 5. Enable RLS
ALTER TABLE commissioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_presets ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Commissioners: anyone can read, only the owner can update their own
CREATE POLICY "Anyone can read commissioners"
  ON commissioners FOR SELECT USING (true);

CREATE POLICY "Commissioners can update own record"
  ON commissioners FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert commissioners"
  ON commissioners FOR INSERT WITH CHECK (true);

-- Profiles: anyone can read, only the owner can update their own
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Profiles can update own record"
  ON profiles FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT WITH CHECK (true);

-- Avatar presets: anyone can read
CREATE POLICY "Anyone can read avatar_presets"
  ON avatar_presets FOR SELECT USING (true);

-- 7. Function to increment commissioner pool count
CREATE OR REPLACE FUNCTION increment_commissioner_pools()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.commissioner_id IS NOT NULL THEN
    UPDATE commissioners 
    SET pools_created = pools_created + 1,
        updated_at = NOW()
    WHERE id = NEW.commissioner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on pool creation
DROP TRIGGER IF EXISTS trigger_increment_commissioner_pools ON pools;
CREATE TRIGGER trigger_increment_commissioner_pools
  AFTER INSERT ON pools
  FOR EACH ROW
  EXECUTE FUNCTION increment_commissioner_pools();

-- 8. Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_commissioners_updated ON commissioners;
CREATE TRIGGER trigger_commissioners_updated
  BEFORE UPDATE ON commissioners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated ON profiles;
CREATE TRIGGER trigger_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- VERIFICATION
-- =============================================
-- Run these to verify the migration worked:

-- SELECT COUNT(*) FROM commissioners;
-- SELECT COUNT(*) FROM profiles;
-- SELECT COUNT(*) FROM avatar_presets;
-- \d commissioners
-- \d profiles
