/**
 * DigiAI Express app — used by both server.js (local) and api/index.js (Vercel).
 */
import 'dotenv/config';
import fs from 'fs/promises';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.js';
import { ensureDirs } from './lib/store.js';
import { ensureUsersFile } from './lib/userStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

async function init() {
  await ensureDirs();
  await ensureUsersFile();
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}
init().catch((e) => console.error('Init error:', e));

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  const file = path.join(PUBLIC_DIR, req.path);
  fs.access(file)
    .then(() => res.sendFile(file))
    .catch(() => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
});

export default app;
