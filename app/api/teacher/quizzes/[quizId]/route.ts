import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params
    console.log('=== GET Quiz API called ===')
    console.log('Quiz ID:', quizId)

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions (
          id,
          question,
          question_type,
          options,
          correct_answer,
          order_number
        )
      `)
      .eq('id', quizId)
      .single()

    if (error) {
      console.error('Supabase error fetching quiz:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    if (!quiz) {
      console.log('Quiz not found for ID:', quizId)
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Sort questions by order_number
    if (quiz.quiz_questions) {
      quiz.quiz_questions.sort((a: any, b: any) => (a.order_number || 0) - (b.order_number || 0))
    }

    console.log('Quiz found:', quiz.title, 'Questions:', quiz.quiz_questions?.length || 0)

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Exception in GET /api/teacher/quizzes/[quizId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete the quiz (questions will be cascade deleted if set up in DB)
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (error) {
      console.error('Error deleting quiz:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/teacher/quizzes/[quizId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params
    const body = await request.json()

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update the quiz
    const { error } = await supabase
      .from('quizzes')
      .update({
        title: body.title,
        quiz_type: body.quiz_type,
        description: body.description,
        start_date: body.start_date,
        end_date: body.end_date,
        time_limit: body.time_limit,
      })
      .eq('id', quizId)

    if (error) {
      console.error('Error updating quiz:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Quiz updated successfully' })
  } catch (error) {
    console.error('Error in PUT /api/teacher/quizzes/[quizId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
