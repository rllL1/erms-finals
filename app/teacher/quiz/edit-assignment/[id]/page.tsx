import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditAssignmentClient from './EditAssignmentClient'

export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile and teacher record
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, teachers(*)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher' || !profile.teachers || profile.teachers.length === 0) {
    redirect('/login')
  }

  const teacherId = profile.teachers[0].id

  // Fetch assignment details
  const { data: assignment } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', teacherId)
    .eq('type', 'assignment')
    .single()

  if (!assignment) {
    redirect('/teacher/quiz')
  }

  return <EditAssignmentClient assignment={assignment} />
}
