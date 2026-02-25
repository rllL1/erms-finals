import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditQuizClient from './EditQuizClient'

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Fetch quiz details
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', teacherId)
    .single()

  if (!quiz) {
    redirect('/teacher/quiz')
  }

  // Fetch quiz questions
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', id)
    .order('order_number', { ascending: true })

  return <EditQuizClient quiz={quiz} questions={questions || []} />
}
