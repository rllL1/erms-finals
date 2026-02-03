# Supabase Setup Guide

## Step 1: Apply Database Schema

1. Go to your Supabase Dashboard: https://rhwgkinajlfuefmslbbb.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content from `supabase/schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

This will:
- ✅ Create all required tables (profiles, students, teachers)
- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Create all necessary RLS policies
- ✅ Set up indexes for better performance
- ✅ Create triggers for auto-updating timestamps

## Step 2: Create Initial Admin User

Since you can't create a user without a profile (due to RLS), you need to create the first admin user manually:

### Option A: Using SQL (Recommended)

1. In Supabase Dashboard, go to **SQL Editor**
2. Run this query to create an admin user:

```sql
-- Create admin auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com', -- Change this to your email
  crypt('admin123', gen_salt('bf')), -- Change this password
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
RETURNING id;
```

3. **IMPORTANT**: Copy the UUID that is returned
4. Run this query with the UUID you just copied:

```sql
-- Create admin profile using the UUID from above
INSERT INTO public.profiles (id, role, email, is_active)
VALUES (
  'PASTE_THE_UUID_HERE', -- Replace with the UUID from step 3
  'admin',
  'admin@example.com', -- Same email as above
  true
);
```

### Option B: Using Supabase Auth Dashboard (Easier)

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: `admin@example.com` (or your preferred email)
   - Password: Create a strong password
   - Auto Confirm User: ✅ Enable this
4. Click **Create user**
5. Copy the UUID of the newly created user
6. Go to **SQL Editor** and run:

```sql
INSERT INTO public.profiles (id, role, email, is_active)
VALUES (
  'PASTE_USER_UUID_HERE', -- Replace with the UUID from step 5
  'admin',
  'admin@example.com', -- Same email as the user
  true
);
```

## Step 3: Verify RLS is Working

1. Go to **Table Editor** in Supabase Dashboard
2. Click on **profiles** table
3. You should see the RLS shield icon (🛡️) next to the table name
4. Repeat for **students** and **teachers** tables

## Step 4: Test Your Application

1. Start your Next.js application:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/login

3. Login with the admin credentials you created

4. You should be redirected to `/admin/dashboard`

5. Try creating a student or teacher to verify everything works

## Troubleshooting

### Error: "new row violates row-level security policy"
- Make sure you created the admin profile correctly
- Verify RLS policies are created by running:
  ```sql
  SELECT schemaname, tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public';
  ```

### Error: "Role not assigned"
- The user exists in `auth.users` but not in `profiles`
- Run the profile creation SQL again with the correct UUID

### Can't read students/teachers data
- Make sure you're logged in as an admin
- Check the browser console for errors
- Verify the RLS policies are active

### Error: "relation 'profiles' does not exist"
- You haven't run the schema.sql file yet
- Go back to Step 1

## Current RLS Policies Summary

### Profiles Table
- ✅ Users can view their own profile
- ✅ Admins can view all profiles
- ✅ Admins can insert/update profiles

### Students Table
- ✅ Students can view their own record
- ✅ Admins can view/insert/update/delete all students
- ✅ Teachers can view all students

### Teachers Table
- ✅ Teachers can view their own record
- ✅ Admins can view/insert/update/delete all teachers

All tables have RLS enabled and are secure! 🔒
