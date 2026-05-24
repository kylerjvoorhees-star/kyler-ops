-- KylerOps V4 Database Schema
-- Run this in Supabase SQL Editor: supabase.com/dashboard/project/fvevhsccpvteeszobzje/sql/new
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- ── NUTRITION LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal        TEXT NOT NULL,
  calories    NUMERIC,
  protein     NUMERIC,
  carbs       NUMERIC,
  fat         NUMERIC,
  note        TEXT,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── JOURNAL ENTRIES (if not already created in V2) ─────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  mood        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── HABIT LOGS (granular per-habit per-day with note support) ───────────────
CREATE TABLE IF NOT EXISTS habit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id    UUID REFERENCES habits(id) ON DELETE CASCADE,
  completed   BOOLEAN DEFAULT TRUE,
  note        TEXT,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── REVIEW ENTRIES (for Operator→review routing) ───────────────────────────
CREATE TABLE IF NOT EXISTS review_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start  DATE NOT NULL,
  section     TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PEOPLE TABLE (CRM contacts) — ensure it exists ─────────────────────────
CREATE TABLE IF NOT EXISTS people (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  company                 TEXT,
  temperature             TEXT CHECK (temperature IN ('hot', 'warm', 'cool')),
  notes                   TEXT,
  relationship_type       TEXT DEFAULT 'professional',
  contact_frequency_days  INTEGER DEFAULT 14,
  last_contact_date       DATE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_logged ON nutrition_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_review_entries_week ON review_entries(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);
