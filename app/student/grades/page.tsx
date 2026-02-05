import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentGradesClient from './StudentGradesClient'

export default async function StudentGradesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get student info
  const { data: student, error } = await supabase
    .from('students')
    .select('id, student_name, email, student_id')
    .eq('user_id', user.id)
    .single()

  if (error || !student) {
    redirect('/login')
  }

  return <StudentGradesClient student={student} />
}
