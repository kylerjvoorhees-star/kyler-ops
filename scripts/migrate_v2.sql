-- KylerOps V2 Database Schema
-- Run this in Supabase SQL Editor: supabase.com/dashboard/project/fvevhsccpvteeszobzje/sql/new

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  ai_priority_score NUMERIC(4,2),
  ai_priority_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  voice_transcript TEXT,
  word_count INTEGER,
  ai_insight TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entry_date)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  linked_habit_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Reviews
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  content TEXT,
  habits_summary JSONB DEFAULT '{}',
  tasks_summary JSONB DEFAULT '{}',
  nutrition_summary JSONB DEFAULT '{}',
  finance_summary JSONB DEFAULT '{}',
  session_summary JSONB DEFAULT '{}',
  highlights TEXT[],
  focus_next_week TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start)
);
