export type UserRole = 'admin' | 'teacher' | 'student'

export interface Profile {
  id: string
  role: UserRole
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  user_id: string
  student_id: string
  student_name: string
  course: string
  email: string
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  user_id: string
  employee_id: string
  teacher_name: string
  email: string
  created_at: string
  updated_at: string
}

export interface UserWithProfile {
  id: string
  email: string
  profile: Profile
  student?: Student
  teacher?: Teacher
}
