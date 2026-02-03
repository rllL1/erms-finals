import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch class details with students
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { classId } = await params

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: classData, error: classError } = await supabase
      .from('group_classes')
      .select(`
        *,
        class_students (
          id,
          student_id,
          joined_at,
          students (
            id,
            student_name,
            email
          )
        )
      `)
      .eq('id', classId)
      .single()

    if (classError) {
      console.error('Error fetching class:', classError)
      throw classError
    }

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ class: classData })
  } catch (error) {
    console.error('Error fetching class details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch class details' },
      { status: 500 }
    )
  }
}

// PUT - Update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { classId } = await params
    const body = await request.json()

    const {
      class_name,
      subject,
      class_start_time,
      class_end_time,
      teacher_name
    } = body

    // Validate time if both are provided
    if (class_start_time && class_end_time && class_end_time <= class_start_time) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    const { data: updatedClass, error } = await supabase
      .from('group_classes')
      .update({
        ...(class_name && { class_name }),
        ...(subject && { subject }),
        ...(class_start_time && { class_start_time }),
        ...(class_end_time && { class_end_time }),
        ...(teacher_name && { teacher_name })
      })
      .eq('id', classId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      message: 'Class updated successfully',
      class: updatedClass
    })
  } catch (error) {
    console.error('Error updating class:', error)
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    )
  }
}

// DELETE - Delete class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { classId } = await params

    const { error } = await supabase
      .from('group_classes')
      .delete()
      .eq('id', classId)

    if (error) throw error

    return NextResponse.json({
      message: 'Class deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    )
  }
}
