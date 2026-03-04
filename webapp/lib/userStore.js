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
    role: user.role ?? 'user',
    active: user.active !== false,
    ...user,
    timecreated: Date.now(),
    timemodified: Date.now()
  };

  const { data, error } = await supabase
    .from('users')
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(id, updates) {
  const allowed = ['name', 'email', 'password', 'role', 'active', 'timemodified'];
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
  if (error) throw error;
  return data;
}
