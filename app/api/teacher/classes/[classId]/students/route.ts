import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch students in a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { classId } = await params

    const { data: students, error } = await supabase
      .from('class_students')
      .select(`
        id,
        student_id,
        status,
        joined_at,
        students (
          id,
          student_name,
          email
        )
      `)
      .eq('class_id', classId)
      .order('joined_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Error fetching class students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a student from class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { classId } = await params
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('class_students')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId)

    if (error) throw error

    return NextResponse.json({
      message: 'Student removed from class successfully'
    })
  } catch (error) {
    console.error('Error removing student:', error)
    return NextResponse.json(
      { error: 'Failed to remove student' },
      { status: 500 }
    )
  }
}

// PATCH - Approve or deny a student's join request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { classId } = await params
    const body = await request.json()
    const { student_id, status } = body

    if (!student_id || !status) {
      return NextResponse.json(
        { error: 'Student ID and status are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'denied'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "approved" or "denied"' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('class_students')
      .update({ status })
      .eq('class_id', classId)
      .eq('student_id', student_id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Student enrollment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: `Student ${status === 'approved' ? 'approved' : 'denied'} successfully`,
      enrollment: data
    })
  } catch (error) {
    console.error('Error updating student status:', error)
    return NextResponse.json(
      { error: 'Failed to update student status' },
      { status: 500 }
    )
  }
}
