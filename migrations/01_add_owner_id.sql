-- Migration: Add owner_id to courses and exams tables for multi-user separation

-- 1. Add owner_id to courses
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id);

-- 2. Add owner_id to exams
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id);

-- 3. Optional: Set a default owner for existing records if needed
-- UPDATE courses SET owner_id = 'YOUR_USER_ID' WHERE owner_id IS NULL;
-- UPDATE exams SET owner_id = 'YOUR_USER_ID' WHERE owner_id IS NULL;
