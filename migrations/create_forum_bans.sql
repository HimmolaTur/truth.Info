-- Migration: create forum_bans table
CREATE TABLE IF NOT EXISTS forum_bans (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

