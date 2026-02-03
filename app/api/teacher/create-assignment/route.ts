import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface AssignmentQuestion {
  question: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { teacherId, title, description, dueDate, allowedFileTypes, maxFileSize, questions } = body

    console.log('Received assignment creation request:', { teacherId, title, dueDate, questionsCount: questions?.length })

    if (!teacherId || !title || !description) {
      return NextResponse.json(
        { error: 'Teacher ID, title, and description are required' },
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

    // Insert assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('quizzes')
      .insert({
        teacher_id: teacherId,
        title,
        type: 'assignment',
        quiz_type: null,
        start_date: null,
        end_date: dueDate || null,
        show_answer_key: false,
      })
      .select()
      .single()

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError)
      return NextResponse.json({ error: assignmentError.message }, { status: 500 })
    }

    console.log('Assignment created:', assignment.id)

    // Insert questions if provided
    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map((q: AssignmentQuestion, index: number) => ({
        quiz_id: assignment.id,
        question_type: 'identification',
        question: q.question,
        options: null,
        correct_answer: '',
        order_number: index + 1,
      }))

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Error creating questions:', questionsError)
        // Don't rollback assignment if questions fail, just log error
        console.warn('Assignment created but questions failed to save')
      } else {
        console.log('Questions inserted:', questionsToInsert.length)
      }
    }

    return NextResponse.json({
      success: true,
      assignment: assignment,
      message: 'Assignment created successfully',
    })
  } catch (error) {
    console.error('Error in create-assignment API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
