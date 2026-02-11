-- Repair Profiles Table Schema
-- Execute this in Supabase SQL Editor

-- 1. Add email column (if missing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR;

-- 2. Add created_at column (if missing) with default time
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Add updated_at column (if missing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Ensure line_user_id exists (should be there already)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS line_user_id VARCHAR;
