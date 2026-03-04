-- Migration: Admin role, user active flag, and token usage tracking

-- 1. Add role and active to users (default: role='user', active=true)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Token usage table (per user, per operation)
CREATE TABLE IF NOT EXISTS token_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    operation TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    timecreated BIGINT NOT NULL
);

-- Optional: Make first user an admin (run manually if needed)
-- UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users LIMIT 1);
-- Or by email: UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
