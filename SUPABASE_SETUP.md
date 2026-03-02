# Supabase Authentication Setup Guide

Your DigiAI application is now connected to Supabase for user authentication! Follow these steps to complete the setup.

## ✅ What's Been Done

- Updated `webapp/lib/userStore.js` to use Supabase instead of local JSON files
- Added `@supabase/supabase-js` dependency to `webapp/package.json`
- Environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY) are already set

## 🔧 Complete the Setup

### Step 1: Create the auth_users Table

You need to run SQL in your Supabase dashboard to create the `auth_users` table:

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com](https://supabase.com) and log in
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Setup SQL**
   - Copy and paste the following SQL:

```sql
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
```

4. **Click "Run"**
   - The table will be created instantly
   - You should see "Success" message

### Step 2: Verify the Connection

Test that everything is working:

1. **Start the application** (if not already running)
2. **Try registering a new user** in the frontend
3. **Check Supabase Dashboard**
   - Go to "Table Editor" in the left sidebar
   - Select "auth_users"
   - You should see your registered user in the table

## 📝 How It Works

### Registration Flow
1. User fills out the registration form on the frontend
2. `POST /api/auth/register` endpoint receives the request
3. `userStore.js` validates email isn't already used
4. Password is hashed using scrypt
5. User record is inserted into Supabase `auth_users` table
6. JWT token is generated and returned to frontend

### Login Flow
1. User enters email and password on frontend
2. `POST /api/auth/login` endpoint receives the request
3. `userStore.js` queries Supabase for the user by email
4. Password is verified against the stored hash
5. JWT token is generated and returned to frontend

### Key Features
- **Secure Password Hashing**: Uses scrypt with salt for password security
- **JWT Tokens**: Stateless authentication with token-based sessions
- **Email Uniqueness**: Database constraints prevent duplicate emails
- **Automatic Timestamps**: Created and updated timestamps are managed automatically

## 🔐 Environment Variables

Your Supabase credentials are already configured:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key (safe to use in frontend)
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key for backend operations (keep secret!)

These are set in your Vercel project's environment variables.

## 🚨 Troubleshooting

### Users not being saved
- ✅ Check that the `auth_users` table exists in Supabase
- ✅ Verify environment variables are correctly set
- ✅ Check browser console and server logs for error messages

### "Table does not exist" error
- Run the SQL setup script above in Supabase SQL Editor

### JWT errors during login
- ✅ Make sure `JWT_SECRET` is set (defaults to 'digitai-dev-secret-change-in-production')
- ✅ Tokens expire after 7 days by default

### CORS or connection errors
- ✅ Verify SUPABASE_URL includes the protocol (https://)
- ✅ Check that your Supabase project is not in development mode with restrictions

## 📚 Next Steps

Your authentication system is now ready! You can:

1. **Deploy to Production**
   - Push to GitHub
   - Deploy to Vercel
   - Supabase automatically handles scaling

2. **Add User Profiles**
   - Extend `auth_users` table with profile fields
   - Create separate `user_profiles` table for user data

3. **Implement Auth Protection**
   - Protect courses and content by user ID
   - Add role-based access control

## 💡 Questions?

- Check Supabase docs: https://supabase.com/docs
- Review the code in `webapp/lib/userStore.js` and `webapp/routes/api.js`
