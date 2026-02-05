import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const { examId } = params
    const { questions } = await request.json()

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete existing questions
    await supabase
      .from('quiz_questions')
      .delete()
      .eq('quiz_id', examId)

    // Insert new questions
    const questionsToInsert = questions.map((q: any, index: number) => ({
      quiz_id: examId,
      question: q.question,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      points: q.points || 1,
      order_number: index + 1,
    }))

    const { error } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert)

    if (error) {
      console.error('Error updating questions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Questions updated successfully' })
  } catch (error) {
    console.error('Error in PUT /api/teacher/exams/[examId]/questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
