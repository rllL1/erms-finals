import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Question {
  type: string
  question: string
  options?: string[]
  correctAnswer: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { teacherId, title, type, quizType, startDate, endDate, showAnswerKey, questions } = body

    console.log('Received quiz creation request:', { teacherId, title, type, questionsCount: questions?.length })

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

    // Insert quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        teacher_id: teacherId,
        title,
        type: 'quiz',
        quiz_type: quizType,
        start_date: startDate || null,
        end_date: endDate || null,
        show_answer_key: showAnswerKey || false,
      })
      .select()
      .single()

    if (quizError) {
      console.error('Error creating quiz:', quizError)
      return NextResponse.json({ error: quizError.message }, { status: 500 })
    }

    console.log('Quiz created:', quiz.id)

    // Insert questions
    const questionsToInsert = questions.map((q: Question, index: number) => ({
      quiz_id: quiz.id,
      question_type: q.type,
      question: q.question,
      options: q.options ? JSON.stringify(q.options) : null,
      correct_answer: q.correctAnswer,
      order_number: index + 1,
    }))

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert)

    if (questionsError) {
      console.error('Error creating questions:', questionsError)
      // Rollback: delete the quiz if questions failed
      await supabase.from('quizzes').delete().eq('id', quiz.id)
      return NextResponse.json({ error: questionsError.message }, { status: 500 })
    }

    console.log('Questions inserted:', questionsToInsert.length)

    return NextResponse.json({
      success: true,
      quiz: quiz,
      message: 'Quiz created successfully',
    })
  } catch (error) {
    console.error('Error in create-quiz API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
