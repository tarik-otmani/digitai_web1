-- DigiAI Supabase Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    active BOOLEAN DEFAULT true,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    owner_id TEXT REFERENCES users(id),
    topic TEXT,
    keywords TEXT,
    level TEXT,
    tone TEXT,
    source TEXT,
    status TEXT,
    outline_json JSONB,
    content_json JSONB,
    file_content TEXT,
    generation_progress TEXT,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL
);

-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    owner_id TEXT REFERENCES users(id),
    course_ref_id TEXT,
    status TEXT,
    num_questions INTEGER,
    difficulty TEXT,
    questions_json JSONB,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL
);

-- Token usage (per user, per AI operation)
CREATE TABLE IF NOT EXISTS token_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    operation TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    timecreated BIGINT NOT NULL
);

-- Enable Row Level Security (RLS) - Basic disable for now to ensure simple migration,
-- but in production you should configure proper policies.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
