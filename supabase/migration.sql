-- ================================
-- Sacred Cosmos Dashboard — Supabase Migration
-- Run this in SQL Editor (supabase.com/dashboard → SQL Editor)
-- ================================

-- Daily cosmic data from n8n workflow
CREATE TABLE IF NOT EXISTS cosmic_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,                    -- one row per day
  generation_timestamp TIMESTAMPTZ,
  is_sunday BOOLEAN DEFAULT false,
  payload JSONB NOT NULL,                       -- full n8n payload (~50-85KB)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup by date (latest first)
CREATE INDEX IF NOT EXISTS idx_cosmic_data_date ON cosmic_data(date DESC);

-- Enable Row Level Security
ALTER TABLE cosmic_data ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all data
CREATE POLICY "Authenticated users can read cosmic_data"
  ON cosmic_data FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE policy for authenticated users
-- Only the Edge Function (using service_role key) can write data
-- This prevents unauthorized data injection from the client
