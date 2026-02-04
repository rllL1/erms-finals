import { createClient } from '@/lib/supabase/server'
import TeacherDashboardClient from './TeacherDashboardClient'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get teacher details
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  if (!teacher) {
    return <div>Teacher not found</div>
  }

  // Get group classes count
  const { count: classesCount } = await supabase
    .from('group_classes')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacher.id)

  // Get total students enrolled in teacher's classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('student_id, class_id, group_classes!inner(teacher_id)')
    .eq('group_classes.teacher_id', teacher.id)

  const uniqueStudents = new Set(enrollments?.map(e => e.student_id) || [])
  const studentsCount = uniqueStudents.size

  // Get quizzes count
  const { count: quizzesCount } = await supabase
    .from('quizzes')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacher.id)

  // Get assignments count
  const { count: assignmentsCount } = await supabase
    .from('quizzes')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacher.id)
    .eq('type', 'assignment')

  // Get pending submissions (not graded)
  const { count: pendingSubmissions } = await supabase
    .from('student_submissions')
    .select(`
      id,
      class_materials!inner(
        class_id,
        group_classes!inner(teacher_id)
      )
    `, { count: 'exact', head: true })
    .eq('is_graded', false)
    .eq('class_materials.group_classes.teacher_id', teacher.id)

  // Get recent submissions for display
  const { data: recentSubmissions } = await supabase
    .from('student_submissions')
    .select(`
      id,
      submitted_at,
      is_graded,
      score,
      max_score,
      students(student_name),
      class_materials(
        title,
        material_type,
        group_classes(class_name)
      )
    `)
    .eq('class_materials.group_classes.teacher_id', teacher.id)
    .order('submitted_at', { ascending: false })
    .limit(10)

  // Get class enrollment data for charts
  const { data: classData } = await supabase
    .from('group_classes')
    .select(`
      id,
      class_name,
      class_code,
      subject,
      class_students(count)
    `)
    .eq('teacher_id', teacher.id)

  return (
    <TeacherDashboardClient
      teacher={teacher}
      stats={{
        classesCount: classesCount || 0,
        studentsCount,
        quizzesCount: quizzesCount || 0,
        assignmentsCount: assignmentsCount || 0,
        pendingSubmissions: pendingSubmissions || 0,
      }}
      recentSubmissions={recentSubmissions || []}
      classData={classData || []}
    />
  )
}
