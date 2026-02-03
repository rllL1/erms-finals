import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ExamQuestion {
  type: string
  question: string
  options?: string[]
  correctAnswer?: string
  points?: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { teacherId, title, period, subject, schoolName, introduction, questions } = body

    console.log('Received exam creation request:', { teacherId, title, period, questionsCount: questions?.length })

    if (!teacherId || !title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Teacher ID, title, and questions are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify teacher exists and belongs to current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', teacherId)
      .eq('user_id', user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found or unauthorized' }, { status: 403 })
    }

    // Insert exam
    const { data: exam, error: examError } = await supabase
      .from('quizzes')
      .insert({
        teacher_id: teacherId,
        title,
        type: 'exam',
        quiz_type: null,
        start_date: null,
        end_date: null,
        show_answer_key: false,
      })
      .select()
      .single()

    if (examError) {
      console.error('Error creating exam:', examError)
      return NextResponse.json({ error: examError.message }, { status: 500 })
    }

    console.log('Exam created:', exam.id)

    // Insert questions
    const questionsToInsert = questions.map((q: ExamQuestion, index: number) => ({
      quiz_id: exam.id,
      question_type: q.type,
      question: q.question,
      options: q.options ? JSON.stringify(q.options) : null,
      correct_answer: q.correctAnswer || '',
      order_number: index + 1,
    }))

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert)

    if (questionsError) {
      console.error('Error creating questions:', questionsError)
      // Rollback: delete the exam if questions failed
      await supabase.from('quizzes').delete().eq('id', exam.id)
      return NextResponse.json({ error: questionsError.message }, { status: 500 })
    }

    console.log('Questions inserted:', questionsToInsert.length)

    return NextResponse.json({
      success: true,
      exam: exam,
      message: 'Exam created successfully',
    })
  } catch (error) {
    console.error('Error in create-exam API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
