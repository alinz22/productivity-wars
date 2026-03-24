-- =============================================
-- 001_schema.sql — Productivity Wars overhaul
-- Run this in your Supabase SQL Editor
-- =============================================

-- ─── Alter existing tables ───────────────────

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE sessions
SET invite_code = UPPER(SUBSTRING(MD5(id::TEXT || RANDOM()::TEXT), 1, 6))
WHERE invite_code IS NULL;

ALTER TABLE sessions ALTER COLUMN invite_code SET NOT NULL;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class TEXT NOT NULL DEFAULT 'warrior',
  ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS in_focus BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS pomodoro_count INT NOT NULL DEFAULT 0;

-- ─── New tables ───────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  class TEXT NOT NULL DEFAULT 'warrior',
  total_xp INT NOT NULL DEFAULT 0,
  all_time_streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

CREATE TABLE IF NOT EXISTS pomodoros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── RLS Policies ────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoros ENABLE ROW LEVEL SECURITY;

-- user_profiles: public read, self insert/update
CREATE POLICY "profiles_read_all" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- friendships: read/write own
CREATE POLICY "friendships_own" ON friendships
  FOR ALL USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

-- achievements: public read, insert via service role
CREATE POLICY "achievements_read_all" ON achievements
  FOR SELECT USING (true);

-- Allow service role to insert achievements (bypasses RLS by default)
-- achievements_insert is handled by the service role key in API routes

-- pomodoros: own player only
CREATE POLICY "pomodoros_own" ON pomodoros
  FOR ALL USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- ─── Realtime ─────────────────────────────────
-- Enable postgres_changes replication on relevant tables.
-- Run each line separately if any fail due to already existing:

ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE taunts;
ALTER PUBLICATION supabase_realtime ADD TABLE pomodoros;
ALTER PUBLICATION supabase_realtime ADD TABLE achievements;
