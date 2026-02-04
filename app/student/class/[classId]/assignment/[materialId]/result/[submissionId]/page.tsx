import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentResultClient from '../../../../quiz/[materialId]/result/[submissionId]/StudentResultClient'

export default async function StudentAssignmentResultPage({
  params,
}: {
  params: Promise<{ classId: string; materialId: string; submissionId: string }>
}) {
  const { classId, materialId, submissionId } = await params
  const cookieStore = await cookies()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get student data
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    redirect('/login')
  }

  return (
    <StudentResultClient
      classId={classId}
      materialId={materialId}
      submissionId={submissionId}
      student={student}
    />
  )
}
