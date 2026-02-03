import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentClassClient from './StudentClassClient'

export default async function StudentClassPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !student) {
    redirect('/login')
  }

  return <StudentClassClient student={student} />
}
