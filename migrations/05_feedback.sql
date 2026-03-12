-- Migration: course feedback / rating (1-5 stars + optional comment)
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    timecreated BIGINT NOT NULL,
    UNIQUE (course_id, user_id)
);

ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
