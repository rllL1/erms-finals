import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ViewQuizClient from './ViewQuizClient'

export default async function ViewQuizPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Fetch quiz details
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', user.id)
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

  return <ViewQuizClient quiz={quiz} questions={questions || []} />
}
