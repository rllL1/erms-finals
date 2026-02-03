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

// Group Class Types
export interface GroupClass {
  id: string
  teacher_id: string
  class_name: string
  subject: string
  class_start_time: string
  class_end_time: string
  teacher_name: string
  class_code: string
  created_at: string
  updated_at: string
  student_count?: number
  class_students?: ClassStudent[]
}

export interface ClassStudent {
  id: string
  class_id: string
  student_id: string
  joined_at: string
  students?: Student
  group_classes?: GroupClass
}

export interface ClassMaterial {
  id: string
  class_id: string
  material_type: 'quiz' | 'assignment'
  quiz_id?: string
  title: string
  description?: string
  time_limit?: number
  due_date?: string
  created_at: string
  updated_at: string
  quizzes?: any
  submission?: StudentSubmission
}

export interface StudentSubmission {
  id: string
  material_id: string
  student_id: string
  quiz_answers?: any
  assignment_response?: string
  assignment_file_url?: string
  score?: number
  max_score?: number
  is_graded: boolean
  auto_graded: boolean
  status: 'pending' | 'submitted' | 'graded'
  submitted_at: string
  graded_at?: string
  graded_by?: string
  student?: Student
}

export interface QuizAttempt {
  id: string
  submission_id: string
  student_id: string
  quiz_id: string
  answers: any
  score?: number
  max_score?: number
  started_at: string
  completed_at?: string
  time_taken?: number
  is_completed: boolean
}
