/**
 * Simple JSON file store for users (no DB required).
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const defaultUsers = [];

export async function ensureUsersFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

export async function getUsers() {
  const raw = await fs.readFile(USERS_FILE, 'utf8').catch(() => '[]');
  return JSON.parse(raw);
}

export async function getUserByEmail(email) {
  const users = await getUsers();
  const normalized = String(email || '').trim().toLowerCase();
  return users.find((u) => (u.email || '').toLowerCase() === normalized) || null;
}

export async function getUserById(id) {
  const users = await getUsers();
  return users.find((u) => String(u.id) === String(id)) || null;
}

export async function addUser(user) {
  const users = await getUsers();
  const id = String(Date.now());
  const record = { id, ...user, timecreated: Date.now(), timemodified: Date.now() };
  users.push(record);
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  return record;
}
