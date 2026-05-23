-- KylerOps V3 Database Schema
-- Run this in Supabase SQL Editor: supabase.com/dashboard/project/fvevhsccpvteeszobzje/sql/new
-- Safe to run multiple times (IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS)

-- ── ADD COLUMNS TO EXISTING TASKS TABLE ────────────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_blocker BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cool'));

-- ── CAPTURES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  tags TEXT[] DEFAULT '{}',
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FINANCE SNAPSHOTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  net_worth NUMERIC(14,2) NOT NULL,
  assets JSONB DEFAULT '{}',
  liabilities JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

-- ── SPENDING ANALYSES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spending_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT,
  filename TEXT,
  income NUMERIC(14,2),
  expenses NUMERIC(14,2),
  net NUMERIC(14,2),
  categories JSONB DEFAULT '[]',
  subscriptions JSONB DEFAULT '[]',
  insight TEXT,
  raw_summary TEXT,
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── HABIT DAILY LOG (granular per-habit per-day) ────────────────────────────
-- Note: habit_completions already exists from V1, this is an alias view
-- No new table needed — habit_completions already tracks this.

-- ── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_blocker ON tasks(is_blocker) WHERE is_blocker = TRUE;
CREATE INDEX IF NOT EXISTS idx_captures_created ON captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_date ON finance_snapshots(snapshot_date DESC);
