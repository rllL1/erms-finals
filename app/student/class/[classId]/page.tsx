import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentClassDetailClient from './StudentClassDetailClient'

export default async function StudentClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
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

  const { classId } = await params

  return <StudentClassDetailClient classId={classId} student={student} />
}
