-- Migration: add sections_partial column to courses for live generation streaming
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sections_partial JSONB DEFAULT NULL;
