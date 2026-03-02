/**
 * Store for users — uses Supabase PostgreSQL.
 */
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
  const id = String(Date.now());
  const record = {
    id,
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
