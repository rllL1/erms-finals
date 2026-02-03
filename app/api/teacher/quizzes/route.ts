import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch quizzes with question count
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions:quiz_questions(count)
      `)
      .eq('teacher_id', teacherId)
      .eq('type', 'quiz')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quizzes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to include question count
    const formattedQuizzes = quizzes?.map(quiz => ({
      ...quiz,
      question_count: quiz.questions?.[0]?.count || 0,
      questions: undefined // Remove the questions object from response
    })) || []

    return NextResponse.json({ quizzes: formattedQuizzes })
  } catch (error) {
    console.error('Error in GET /api/teacher/quizzes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
