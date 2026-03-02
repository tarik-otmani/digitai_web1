-- ============================================
-- Supabase Authentication Users Table Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to https://supabase.com dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" → "New Query"
-- 4. Copy and paste this entire script
-- 5. Click "Run"
-- ============================================

-- Create the auth_users table
CREATE TABLE IF NOT EXISTS public.auth_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON public.auth_users(username);
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON public.auth_users(email);

-- Create function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before any UPDATE
CREATE TRIGGER update_auth_users_updated_at 
  BEFORE UPDATE ON public.auth_users
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Setup complete! The table is ready to use.
-- ============================================
