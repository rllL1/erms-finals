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
