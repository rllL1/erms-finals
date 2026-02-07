import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentMessagesClient from './StudentMessagesClient'

export default async function StudentMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get student data
  const { data: student } = await supabase
    .from('students')
    .select('id, student_name')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    redirect('/login')
  }

  return <StudentMessagesClient userId={user.id} studentId={student.id} studentName={student.student_name} />
}
