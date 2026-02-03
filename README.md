# Exam Record Management System (ERMS)

A secure, role-based education management system built with Next.js (App Router) and Supabase.

## 🚀 Features

- **Unified Login Page**: Single login for Admin, Teacher, and Student roles
- **Role-Based Access Control (RBAC)**: Secure middleware-protected routes
- **Admin Dashboard**: Full user management capabilities
- **Teacher Portal**: View students and manage courses
- **Student Portal**: View profile and enrolled courses
- **Supabase Integration**: Authentication, database, and Row Level Security

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Auth**: Supabase Auth (Email + Password)

## 📁 Project Structure

```
erms-final/
├── app/
│   ├── admin/
│   │   ├── components/
│   │   │   ├── AdminHeader.tsx
│   │   │   └── AdminSidebar.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   ├── AddUserModal.tsx
│   │   │   ├── StudentsTable.tsx
│   │   │   ├── TeachersTable.tsx
│   │   │   ├── UsersClient.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── teacher/
│   │   ├── components/
│   │   │   ├── TeacherHeader.tsx
│   │   │   └── TeacherSidebar.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── student/
│   │   ├── components/
│   │   │   ├── StudentHeader.tsx
│   │   │   └── StudentSidebar.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── login/
│   │   ├── LoginForm.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── actions/
│   │   ├── admin.ts
│   │   └── auth.ts
│   ├── supabase/
│   │   ├── admin.ts
│   │   ├── client.ts
│   │   ├── middleware.ts
│   │   └── server.ts
│   └── types/
│       └── index.ts
├── supabase/
│   └── schema.sql
├── middleware.ts
└── .env.local
```

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd erms-final
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys

### 3. Configure Environment Variables

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Set Up Database Schema

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and execute the contents of `supabase/schema.sql`

### 5. Create Initial Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" and create an admin account with email and password
3. Copy the user's UUID
4. Run this SQL to create the admin profile:

```sql
INSERT INTO profiles (id, role, email)
VALUES ('YOUR_ADMIN_USER_UUID', 'admin', 'admin@example.com');
```

### 6. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔐 Authentication Flow

1. User enters email and password on login page
2. Supabase authenticates the credentials
3. System fetches user role from `profiles` table
4. Middleware validates and redirects based on role:
   - **Admin** → `/admin/dashboard`
   - **Teacher** → `/teacher/dashboard`
   - **Student** → `/student/dashboard`

## 📊 Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| role | ENUM | admin, teacher, student |
| email | TEXT | User email |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Creation date |

### students
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| student_id | TEXT | Unique student identifier |
| student_name | TEXT | Full name |
| course | TEXT | Enrolled course |
| email | TEXT | Email address |

### teachers
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| employee_id | TEXT | Unique employee identifier |
| teacher_name | TEXT | Full name |
| email | TEXT | Email address |

## 🛡️ Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Middleware Protection**: Route protection at the edge
- **Server-Side Validation**: Role verification in server components
- **Service Role Isolation**: Admin operations use server-only service key
- **Password Hashing**: Handled by Supabase Auth

## 👤 User Roles & Permissions

### Admin
- Full system access
- Create/manage students and teachers
- View all users
- Enable/disable accounts
- Delete users

### Teacher
- Access teacher dashboard
- View student list
- View own profile

### Student
- Access student dashboard
- View own profile and course

## 📝 Error Handling

The system handles:
- Invalid login credentials
- Duplicate email/ID registration
- Unauthorized access attempts
- Session expiration
- Database operation failures

## 🚀 Deployment

1. Deploy to Vercel:
```bash
npm run build
vercel --prod
```

2. Set environment variables in Vercel dashboard
3. Ensure Supabase project is in production mode

## 📄 License

MIT License
