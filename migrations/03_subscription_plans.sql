-- DigiAI Subscription Plans Migration

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    price DECIMAL(10,2),
    billing_cycle TEXT, -- 'month', 'year', or NULL for free/on_demand
    max_courses_per_month INTEGER,
    max_questions_per_exam INTEGER,
    features JSONB,
    watermark BOOLEAN DEFAULT false,
    pdf_export BOOLEAN DEFAULT false,
    lms_export BOOLEAN DEFAULT false,
    api_access BOOLEAN DEFAULT false,
    mass_generation BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    current_period_start BIGINT,
    current_period_end BIGINT,
    cancel_at_period_end BOOLEAN DEFAULT false,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL,
    UNIQUE(user_id) -- One subscription per user
);

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS monthly_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year_month TEXT NOT NULL, -- Format: '2024-01'
    courses_created INTEGER DEFAULT 0,
    exams_created INTEGER DEFAULT 0,
    questions_generated INTEGER DEFAULT 0,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL,
    UNIQUE(user_id, year_month)
);

-- Insert subscription plans
INSERT INTO subscription_plans (id, name, price, billing_cycle, max_courses_per_month, max_questions_per_exam, features, watermark, pdf_export, lms_export, api_access, mass_generation, timecreated, timemodified) VALUES
('free', 'Free', 0, NULL, 1, 10, '["1 cours", "10 questions examen", "watermark"]', true, false, false, false, false, 1640995200000, 1640995200000),
('creator', 'Creator', 15.00, 'month', 20, 50, '["20 cours / mois", "50 questions examen", "export PDF"]', false, true, false, false, false, 1640995200000, 1640995200000),
('pro', 'Pro', 29.00, 'month', NULL, NULL, '["cours illimités", "questions illimitées", "export LMS"]', false, true, true, false, false, 1640995200000, 1640995200000),
('institution', 'Institutions', NULL, NULL, NULL, NULL, '["génération massive", "API", "LMS integration"]', false, true, true, true, true, 1640995200000, 1640995200000);

-- Add subscription columns to users table
ALTER TABLE users ADD COLUMN subscription_plan_id TEXT REFERENCES subscription_plans(id);
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_expires_at BIGINT;

-- Enable Row Level Security (RLS)
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_usage DISABLE ROW LEVEL SECURITY;
