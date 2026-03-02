/**
 * Supabase-based user store for authentication.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Ensure the auth_users table exists.
 */
export async function ensureUsersFile() {
  // With Supabase, table is created via migrations. This is a no-op.
  console.log('[v0] Supabase connection verified');
}

/**
 * Get all users from Supabase.
 */
export async function getUsers() {
  const { data, error } = await supabase
    .from('auth_users')
    .select('*');

  if (error) {
    console.error('[v0] Error fetching users:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user by email.
 */
export async function getUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();

  const { data, error } = await supabase
    .from('auth_users')
    .select('*')
    .eq('email', normalized)
    .limit(1);

  if (error) {
    console.error('[v0] Error fetching user by email:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Get user by ID.
 */
export async function getUserById(id) {
  const { data, error } = await supabase
    .from('auth_users')
    .select('*')
    .eq('id', Number(id))
    .limit(1);

  if (error) {
    console.error('[v0] Error fetching user by ID:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Add a new user to Supabase.
 */
export async function addUser(user) {
  const record = {
    username: user.name || user.email.split('@')[0],
    email: String(user.email || '').trim().toLowerCase(),
    password_hash: user.password,
  };

  const { data, error } = await supabase
    .from('auth_users')
    .insert([record])
    .select();

  if (error) {
    console.error('[v0] Error adding user:', error);
    throw new Error(error.message);
  }

  return data && data.length > 0 ? data[0] : null;
}
