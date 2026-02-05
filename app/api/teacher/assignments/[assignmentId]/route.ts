import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: assignment, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (error) {
      console.error('Error fetching assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error in GET /api/teacher/assignments/[assignmentId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete the assignment (questions will be cascade deleted if set up in DB)
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      console.error('Error deleting assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/teacher/assignments/[assignmentId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params
    const body = await request.json()

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update the assignment
    const { error } = await supabase
      .from('quizzes')
      .update({
        title: body.title,
        description: body.description,
        start_date: body.start_date,
        end_date: body.end_date,
        due_date: body.due_date,
        allowed_file_types: body.allowed_file_types,
        max_file_size: body.max_file_size,
      })
      .eq('id', assignmentId)

    if (error) {
      console.error('Error updating assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Assignment updated successfully' })
  } catch (error) {
    console.error('Error in PUT /api/teacher/assignments/[assignmentId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
