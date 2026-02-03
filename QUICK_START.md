# 🚀 Quick Start: Enable RLS and Connect to Supabase

Your code is already properly configured! You just need to set up the database. Follow these steps:

## ✅ What's Already Working

- ✅ RLS (Row Level Security) is defined in your schema
- ✅ All security policies are configured
- ✅ Supabase client connections are set up correctly
- ✅ Environment variables are configured
- ✅ Authentication flow is implemented
- ✅ Middleware protects your routes

## 📋 What You Need To Do

### Step 1: Run the Database Schema

1. Open Supabase Dashboard: https://rhwgkinajlfuefmslbbb.supabase.co
2. Go to **SQL Editor** (in left sidebar)
3. Click **New Query**
4. Copy the entire content from `supabase/schema.sql`
5. Paste and click **Run**

### Step 2: Create Your First Admin User

Choose ONE method:

#### Method A: Using the Helper Script (Easiest)

1. Open `supabase/create-admin.sql`
2. Change the email and password in the file:
   ```sql
   'admin@example.com', -- Change to your email
   crypt('Admin123!', gen_salt('bf')), -- Change to your password
   ```
3. Copy the entire file content
4. In Supabase SQL Editor, paste and click **Run**
5. Done! You can now login with those credentials

#### Method B: Using Supabase Dashboard

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Fill in:
   - Email: your email
   - Password: your password
   - ✅ Check "Auto Confirm User"
4. Click **Create user**
5. Copy the user's UUID (shown in the users list)
6. Go to SQL Editor and run:
   ```sql
   INSERT INTO public.profiles (id, role, email, is_active)
   VALUES (
     'PASTE_UUID_HERE',
     'admin',
     'your-email@example.com',
     true
   );
   ```

### Step 3: Verify Setup (Optional but Recommended)

1. In Supabase SQL Editor, run the content from `supabase/verify-setup.sql`
2. Check that you see:
   - ✅ All tables exist
   - ✅ RLS Enabled on all tables
   - ✅ 15+ policies created
   - ✅ At least 1 admin user

### Step 4: Test Your Application

1. Start your app:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Login with your admin credentials

4. You should see the admin dashboard!

## 🔒 Your RLS Security Summary

All these security policies are ALREADY in your schema:

### Profiles Table
- Users can view their own profile
- Admins can view/insert/update all profiles

### Students Table  
- Students can view their own record
- Teachers can view all students
- Admins can view/insert/update/delete all students

### Teachers Table
- Teachers can view their own record
- Admins can view/insert/update/delete all teachers

## 🐛 Common Issues

### "relation 'profiles' does not exist"
→ You haven't run Step 1 yet. Run `supabase/schema.sql` in SQL Editor.

### "Role not assigned" when logging in
→ The user exists but doesn't have a profile. Run Step 2 again with the correct UUID.

### Can't see students/teachers data
→ Make sure you're logged in as an admin. Check browser console for errors.

### "new row violates row-level security policy"
→ RLS is working! Make sure you created the admin profile correctly in Step 2.

## 📝 Next Steps After Setup

Once logged in as admin, you can:
- Create students via the Admin → Users page
- Create teachers via the Admin → Users page
- View dashboard statistics
- Manage user accounts

The system will automatically:
- Hash passwords securely
- Enforce RLS policies
- Protect routes based on user roles
- Manage sessions with Supabase Auth

## 🔗 Useful Files

- `supabase/schema.sql` - Complete database schema with RLS
- `supabase/create-admin.sql` - Quick admin user creation
- `supabase/verify-setup.sql` - Check if everything is set up correctly
- `SUPABASE_SETUP.md` - Detailed documentation

---

**Your database is secured with Row Level Security! 🔒**
All users can only access data they're authorized to see.
