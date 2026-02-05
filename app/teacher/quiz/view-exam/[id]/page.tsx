import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ViewExamClient from './ViewExamClient'

export default async function ViewExamPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Fetch exam details
  const { data: exam } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .eq('type', 'exam')
    .single()

  if (!exam) {
    redirect('/teacher/quiz')
  }

  // Fetch exam questions
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', id)
    .order('order_number', { ascending: true })

  return <ViewExamClient exam={exam} questions={questions || []} />
}
