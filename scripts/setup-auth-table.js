#!/usr/bin/env node
/**
 * Setup script to create auth_users table in Supabase.
 * Run with: node scripts/setup-auth-table.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your environment variables in the Vars section.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAuthTable() {
  try {
    console.log('🔧 Setting up auth_users table...');

    // Check if table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('auth_users')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ auth_users table already exists');
      return;
    }

    // If table doesn't exist, create it using RPC or raw SQL
    // Since we don't have direct RPC access, we'll document the SQL to run manually
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.auth_users (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_auth_users_username ON public.auth_users(username);
      CREATE INDEX IF NOT EXISTS idx_auth_users_email ON public.auth_users(email);

      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE ON public.auth_users
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `;

    console.log('⚠️  Please run the following SQL in Supabase SQL Editor:');
    console.log('---');
    console.log(createTableSQL);
    console.log('---');
    console.log('\n📍 Steps:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Click "New Query"');
    console.log('3. Paste the SQL above');
    console.log('4. Click "Run"');
    console.log('\nOnce done, your authentication system will be connected to Supabase!');

  } catch (error) {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  }
}

setupAuthTable();
