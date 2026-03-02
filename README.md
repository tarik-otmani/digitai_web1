# DigitAI

Web app for generating courses and exams with AI (Gemini).

## Quick Start

```bash
# 1. Install dependencies
cd webapp && npm install
cd ../new-frontend && npm install

# 2. Configure
cp webapp/.env.example webapp/.env
# Edit webapp/.env: GEMINI_API_KEY, JWT_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY

# 3. Setup Database (Supabase)
# Run the contents of supabase_schema.sql in your Supabase SQL Editor.

# 3. Build frontend
cd new-frontend && npm run build

# 4. Start server
cd webapp && npm start
```

Open http://localhost:3000

## Features

- **Generate Course** — Topic → outline → full content with AI
- **Upload Course** — PDF, DOCX, TXT, MD → AI structures into sections
- **Generate Exam** — From any course, create MCQ, true/false, short answer, essay
- **Export PDF** — Course or exam for printing
- **Login / Register** — User accounts with JWT

## Structure

- `webapp/` — Node.js/Express backend, API, PDF generation
- `new-frontend/` — React + Vite frontend
