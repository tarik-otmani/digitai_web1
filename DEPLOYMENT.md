# Deploy DigiAI to Vercel

This guide explains how to deploy the DigiAI web app to Vercel and share the URL with your client.

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- [GitHub](https://github.com) account (for Git-based deployment)
- **GEMINI_API_KEY** from [Google AI Studio](https://aistudio.google.com/apikey)
- **JWT_SECRET** — a random string for auth tokens (e.g. `openssl rand -hex 32`)

## Quick Deploy

### Option 1: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# From project root
cd /home/totmani/digitai_web

# Deploy (follow prompts)
vercel
```

### Option 2: Deploy via GitHub

1. Push your project to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** (leave default)
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install && cd webapp && npm install && cd ../new-frontend && npm install`
   - **Output Directory:** (leave empty — static files go to `public/`)

5. Add **Environment Variables** in Project Settings → Environment Variables:
   - `GEMINI_API_KEY` — your Google Gemini API key
   - `JWT_SECRET` — a secure random string (e.g. 32+ chars)
   - `DATA_DIR` — `/tmp/digitai-data` (already set in vercel.json)
   - `UPLOAD_DIR` — `/tmp/digitai-uploads` (already set in vercel.json)

6. Deploy.

## After Deployment

- Your app will be available at `https://your-project.vercel.app`
- Share this URL with your client.

## Important: Data Persistence

Vercel serverless functions use a **read-only filesystem**. Data (courses, exams, users) is stored in `/tmp`, which is **ephemeral** — it is reset when functions restart or scale.

- **Demo / testing:** The app will work, but data may not persist across sessions.
- **Production:** For persistent data, consider:
  - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
  - [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
  - Or deploy to [Railway](https://railway.app) or [Render](https://render.com) for persistent file storage with minimal changes.

## Local Development

```bash
# Build frontend (outputs to public/)
npm run build

# Run backend
npm start
# or with watch: cd webapp && npm run dev
```

## Environment Variables Summary

| Variable       | Required | Description                          |
|----------------|----------|--------------------------------------|
| `GEMINI_API_KEY` | Yes      | Google Gemini API key                |
| `JWT_SECRET`     | Yes      | Secret for JWT auth tokens           |
| `DATA_DIR`       | No       | Set to `/tmp/digitai-data` on Vercel  |
| `UPLOAD_DIR`     | No       | Set to `/tmp/digitai-uploads` on Vercel |
