'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendWelcomeEmail } from '@/lib/email'

// Helper function to verify admin access
async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized: Not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  return user
}

export async function createStudent(formData: FormData) {
  try {
    await verifyAdminAccess()

    const studentId = formData.get('studentId') as string
    const studentName = formData.get('studentName') as string
    const course = formData.get('course') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate required fields
    if (!studentId || !studentName || !course || !email || !password) {
      return { error: 'All fields are required' }
    }

    // Validate password length
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' }
    }

    const adminClient = createAdminClient()
    const supabase = await createClient()

    // Check if student ID already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', studentId)
      .single()

    if (existingStudent) {
      return { error: 'Student ID already exists' }
    }

    // Check if email already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return { error: 'Email already exists' }
    }

    // Create auth user using admin client
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return { error: `Failed to create user: ${authError.message}` }
    }

    if (!authData.user) {
      return { error: 'Failed to create user account' }
    }

    // Update the auto-created profile with student role
    // (The trigger creates a default profile, we just need to update it)
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        role: 'student',
        email: email,
        is_active: true,
      })
      .eq('id', authData.user.id)

    if (profileError) {
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: `Failed to update profile: ${profileError.message}` }
    }

    // Create student record
    const { error: studentError } = await adminClient
      .from('students')
      .insert({
        user_id: authData.user.id,
        student_id: studentId,
        student_name: studentName,
        course: course,
        email: email,
      })

    if (studentError) {
      // Rollback: delete profile and auth user
      await adminClient.from('profiles').delete().eq('id', authData.user.id)
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: `Failed to create student record: ${studentError.message}` }
    }

    // Send welcome email to the new student
    const emailResult = await sendWelcomeEmail({
      to: email,
      name: studentName,
      email: email,
      password: password,
      userType: 'student',
    })

    revalidatePath('/admin/users')
    
    if (!emailResult.success) {
      // Account created but email failed - still return success with warning
      return { 
        success: true, 
        message: 'Student created successfully. Note: Welcome email could not be sent.' 
      }
    }

    return { success: true, message: 'Student created successfully and welcome email sent!' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function createTeacher(formData: FormData) {
  try {
    await verifyAdminAccess()

    const employeeId = formData.get('employeeId') as string
    const teacherName = formData.get('teacherName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate required fields
    if (!employeeId || !teacherName || !email || !password) {
      return { error: 'All fields are required' }
    }

    // Validate password length
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' }
    }

    const adminClient = createAdminClient()
    const supabase = await createClient()

    // Check if employee ID already exists
    const { data: existingTeacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('employee_id', employeeId)
      .single()

    if (existingTeacher) {
      return { error: 'Employee ID already exists' }
    }

    // Check if email already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return { error: 'Email already exists' }
    }

    // Create auth user using admin client
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return { error: `Failed to create user: ${authError.message}` }
    }

    if (!authData.user) {
      return { error: 'Failed to create user account' }
    }

    // Update the auto-created profile with teacher role
    // (The trigger creates a default profile, we just need to update it)
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        role: 'teacher',
        email: email,
        is_active: true,
      })
      .eq('id', authData.user.id)

    if (profileError) {
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: `Failed to create profile: ${profileError.message}` }
    }

    // Create teacher record
    const { error: teacherError } = await adminClient
      .from('teachers')
      .insert({
        user_id: authData.user.id,
        employee_id: employeeId,
        teacher_name: teacherName,
        email: email,
      })

    if (teacherError) {
      // Rollback: delete profile and auth user
      await adminClient.from('profiles').delete().eq('id', authData.user.id)
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: `Failed to create teacher record: ${teacherError.message}` }
    }

    // Send welcome email to the new teacher
    const emailResult = await sendWelcomeEmail({
      to: email,
      name: teacherName,
      email: email,
      password: password,
      userType: 'teacher',
    })

    revalidatePath('/admin/users')
    
    if (!emailResult.success) {
      // Account created but email failed - still return success with warning
      return { 
        success: true, 
        message: 'Teacher created successfully. Note: Welcome email could not be sent.' 
      }
    }

    return { success: true, message: 'Teacher created successfully and welcome email sent!' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function getStudents() {
  try {
    await verifyAdminAccess()
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles:user_id (
          is_active
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function getTeachers() {
  try {
    await verifyAdminAccess()
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        profiles:user_id (
          is_active
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    await verifyAdminAccess()
    
    const adminClient = createAdminClient()
    
    const { error } = await adminClient
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function deleteUser(userId: string) {
  try {
    await verifyAdminAccess()
    
    const adminClient = createAdminClient()
    
    // Delete auth user (this will cascade delete profile, student/teacher due to ON DELETE CASCADE)
    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function getDashboardStats() {
  try {
    await verifyAdminAccess()
    
    const supabase = await createClient()
    
    // Get counts
    const [
      studentsResult, 
      teachersResult, 
      profilesResult, 
      quizzesResult, 
      examsResult, 
      assignmentsResult,
      groupClassesResult,
      activeStudentsResult
    ] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('teachers').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('type', 'quiz'),
      supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('type', 'exam'),
      supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('type', 'assignment'),
      supabase.from('group_classes').select('id', { count: 'exact', head: true }),
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])

    // Get recent activity
    const { data: recentQuizzes } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        type,
        created_at,
        teachers!inner (
          teacher_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get submission stats
    const { data: submissions } = await supabase
      .from('quiz_submissions')
      .select('id, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    return {
      totalStudents: studentsResult.count || 0,
      totalTeachers: teachersResult.count || 0,
      totalUsers: profilesResult.count || 0,
      totalQuizzes: quizzesResult.count || 0,
      totalExams: examsResult.count || 0,
      totalAssignments: assignmentsResult.count || 0,
      totalGroupClasses: groupClassesResult.count || 0,
      activeStudents: activeStudentsResult.count || 0,
      recentActivity: recentQuizzes || [],
      weeklySubmissions: submissions?.length || 0,
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalUsers: 0,
      totalQuizzes: 0,
      totalExams: 0,
      totalAssignments: 0,
      totalGroupClasses: 0,
      activeStudents: 0,
      recentActivity: [],
      weeklySubmissions: 0,
    }
  }
}
