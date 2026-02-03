import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentSubmissionsClient from './StudentSubmissionsClient'

export default async function StudentSubmissionsPage({
  params,
}: {
  params: Promise<{ classId: string; studentId: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !teacher) {
    redirect('/login')
  }

  const { classId, studentId } = await params

  return (
    <StudentSubmissionsClient
      classId={classId}
      studentId={studentId}
      teacher={teacher}
    />
  )
}
