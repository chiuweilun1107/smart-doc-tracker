-- Migration: Add Line verification code fields to profiles
-- Execute this in Supabase SQL Editor

-- 1. Add verification code columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS line_verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS line_verification_expires_at TIMESTAMPTZ;

-- 2. Create index for faster verification lookup
CREATE INDEX IF NOT EXISTS idx_profiles_verification_code
ON profiles(line_verification_code);

-- 3. Add comment
COMMENT ON COLUMN profiles.line_verification_code IS 'Temporary 6-digit code for Line account binding verification';
COMMENT ON COLUMN profiles.line_verification_expires_at IS 'Expiration timestamp for verification code (typically 15 minutes)';
