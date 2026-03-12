import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase.js';

export async function ensureUsersFile() {
  // No-op for Supabase migration, schema should be created manually.
}

export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
}

export async function getUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', normalized)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data || null;
}

export async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', String(id))
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function addUser(user) {
  const id = uuidv4();
  const record = {
    id,
    email: user.email,
    password: user.password,
    name: user.name,
    timecreated: Date.now(),
    timemodified: Date.now()
  };
  // Optional columns (migration 02): only set if you know the table has them
  if (user.role !== undefined) record.role = user.role;
  if (user.active !== undefined) record.active = user.active;

  const { data, error } = await supabase
    .from('users')
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return { ...data, role: data.role ?? 'user', active: data.active !== false };
}

export async function updateUser(id, updates) {
  const allowed = ['name', 'email', 'password', 'role', 'active', 'plan', 'timemodified'];
  const record = { timemodified: Date.now() };
  for (const key of allowed) {
    if (updates[key] !== undefined) record[key] = updates[key];
  }
  const { data, error } = await supabase
    .from('users')
    .update(record)
    .eq('id', String(id))
    .select()
    .single();
  if (error) {
    if (error.message && /column.*(role|active).*does not exist/i.test(error.message)) {
      const err = new Error('User table missing role/active columns. Run migration 02_admin_and_token_usage.sql.');
      err.code = 'MIGRATION_REQUIRED';
      throw err;
    }
    throw error;
  }
  return { ...data, role: data.role ?? 'user', active: data.active !== false };
}
