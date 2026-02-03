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

    // Fetch exams with question count
    const { data: exams, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions:quiz_questions(count)
      `)
      .eq('teacher_id', teacherId)
      .eq('type', 'exam')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching exams:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to include question count
    const formattedExams = exams?.map(exam => ({
      ...exam,
      question_count: exam.questions?.[0]?.count || 0,
      questions: undefined // Remove the questions object from response
    })) || []

    return NextResponse.json({ exams: formattedExams })
  } catch (error) {
    console.error('Error in GET /api/teacher/exams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
