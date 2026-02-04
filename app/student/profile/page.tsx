import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentProfileClient from './StudentProfileClient'

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get student details
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    redirect('/login')
  }

  return <StudentProfileClient student={student} />
}
