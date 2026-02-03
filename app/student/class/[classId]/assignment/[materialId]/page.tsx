import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentAssignmentClient from './StudentAssignmentClient'

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ classId: string; materialId: string }>
}) {
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

  const { classId, materialId } = await params

  return (
    <StudentAssignmentClient
      classId={classId}
      materialId={materialId}
      student={student}
    />
  )
}
