# DigiAI Web App

Standalone web application for **DigiAI** — AI-powered course and exam generation. Frontend uses the **Stitch template** (project ID `6988869128424910258`): Lexend font, primary `#135bec`, 8px roundness, and full animations.

## Features

- **Generate course** — Enter a topic; get an outline, then generate full section content with Google Gemini.
- **Upload course** — Upload PDF, DOCX, TXT or MD; we extract text and create a course.
- **Generate exam** — From any course, generate MCQ, true/false, short answer and essay questions.
- **Preview** — View course and exam content in the app.

## Setup

1. **Install dependencies**

   ```bash
   cd webapp
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env and set:
   # GEMINI_API_KEY=your_google_gemini_api_key
   # PORT=3000  (optional)
   ```

3. **Run**

   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000).

- **Development** (auto-restart on file change): `npm run dev`

## API key

- Set `GEMINI_API_KEY` in `.env` for server-side defaults, or
- Save your key in the app: **Dashboard → API settings**. It is stored in the browser only.

## Project structure

- `server.js` — Express app, static files, API mount.
- `routes/api.js` — REST API: courses (outline, confirm-generation, generate, upload), exams (generate), status.
- `lib/` — `gemini.js`, `courseGenerator.js`, `examGenerator.js`, `uploadParser.js`, `store.js`.
- `public/` — Frontend: `index.html` (landing), `dashboard.html`, `generate-course.html`, `upload-course.html`, `generate-exam.html`, `preview-course.html`, `preview-exam.html`, `generate-course-pending.html`, `styles.css`, `app.js`.
- `data/` — JSON store for courses and exams (created on first run).
- `uploads/` — Uploaded files (created on first run).

## Stitch design (6988869128424910258)

- **Colors:** primary `#135bec`, surfaces and borders from the Stitch palette.
- **Font:** Lexend (Google Fonts).
- **Animations:** `digitai-fade-in`, `digitai-card-in`, hover transitions on cards and buttons.
- **Icons:** Inline SVGs for generate (magic/check), upload (cloud arrow), exam (clipboard list), key, chevron, book, question.

No Moodle or database required — runs as a single Node app with file storage.
