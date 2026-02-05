import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ViewAssignmentClient from './ViewAssignmentClient'

export default async function ViewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    redirect('/login')
  }

  // Fetch assignment details
  const { data: assignment } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .eq('type', 'assignment')
    .single()

  if (!assignment) {
    redirect('/teacher/quiz')
  }

  // Fetch submissions count
  const { count: submissionsCount } = await supabase
    .from('quiz_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('quiz_id', id)

  return <ViewAssignmentClient assignment={assignment} submissionsCount={submissionsCount || 0} />
}
