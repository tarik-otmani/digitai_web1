-- Migration: Centralized app settings (admin-managed Gemini API key)

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_by TEXT REFERENCES users(id),
    timeupdated BIGINT NOT NULL
);

ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Seed with empty key (admin must set it via dashboard)
INSERT INTO app_settings (key, value, updated_by, timeupdated)
VALUES ('gemini_api_key', '', NULL, 0)
ON CONFLICT (key) DO NOTHING;
