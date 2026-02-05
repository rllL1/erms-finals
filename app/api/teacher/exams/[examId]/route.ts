import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch the exam with questions
    const { data: exam, error: examError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      console.error('Error fetching exam:', examError)
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Fetch questions for the exam
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', examId)
      .order('order_number', { ascending: true })

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: questionsError.message }, { status: 500 })
    }

    // Transform data to match PDF generator format
    const examData = {
      id: exam.id,
      title: exam.title,
      period: exam.period || 'general',
      schoolName: exam.school_name || 'School Name',
      introduction: exam.introduction || '',
      questions: (questions || []).map((q: any) => ({
        id: q.id,
        type: q.question_type,
        question: q.question,
        options: q.question_type === 'multiple-choice' && q.options 
          ? (Array.isArray(q.options) ? q.options : q.options.options || [])
          : undefined,
        points: q.points || 1,
      })),
    }

    return NextResponse.json(examData)
  } catch (error) {
    console.error('Error in GET /api/teacher/exams/[examId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete the exam (questions will be cascade deleted if set up in DB)
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', examId)

    if (error) {
      console.error('Error deleting exam:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Exam deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/teacher/exams/[examId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params
    const body = await request.json()

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update the exam
    const { error } = await supabase
      .from('quizzes')
      .update({
        title: body.title,
        period: body.period,
        school_name: body.school_name,
        introduction: body.introduction,
        show_answer_key: body.show_answer_key,
      })
      .eq('id', examId)

    if (error) {
      console.error('Error updating exam:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Exam updated successfully' })
  } catch (error) {
    console.error('Error in PUT /api/teacher/exams/[examId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
