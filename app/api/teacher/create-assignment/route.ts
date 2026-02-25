import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { teacherId, title, description, dueDate, attachmentUrl, attachmentName } = body

    console.log('Received assignment creation request:', { teacherId, title, dueDate, hasAttachment: !!attachmentUrl })

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
        description,
        type: 'assignment',
        quiz_type: null,
        start_date: null,
        end_date: dueDate || null,
        show_answer_key: false,
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
      })
      .select()
      .single()

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError)
      return NextResponse.json({ error: assignmentError.message }, { status: 500 })
    }

    console.log('Assignment created:', assignment.id)

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
