import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all classes a student has joined
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    const { data: enrollments, error } = await supabase
      .from('class_students')
      .select(`
        id,
        joined_at,
        group_classes (
          id,
          class_name,
          subject,
          class_start_time,
          class_end_time,
          teacher_name,
          class_code,
          created_at
        )
      `)
      .eq('student_id', studentId)
      .order('joined_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ classes: enrollments })
  } catch (error) {
    console.error('Error fetching student classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}

// POST - Join a class using class code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { student_id, class_code } = body

    if (!student_id || !class_code) {
      return NextResponse.json(
        { error: 'Student ID and class code are required' },
        { status: 400 }
      )
    }

    // Find the class by code
    const { data: classData, error: classError } = await supabase
      .from('group_classes')
      .select('id, class_name, subject, teacher_name')
      .eq('class_code', class_code)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Invalid class code' },
        { status: 404 }
      )
    }

    // Check if student is already enrolled
    const { data: existingEnrollment, error: enrollError } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classData.id)
      .eq('student_id', student_id)
      .single()

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this class' },
        { status: 409 }
      )
    }

    // Enroll student in class
    const { data: enrollment, error: insertError } = await supabase
      .from('class_students')
      .insert({
        class_id: classData.id,
        student_id
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      message: 'Successfully joined class',
      enrollment,
      class: classData
    }, { status: 201 })
  } catch (error) {
    console.error('Error joining class:', error)
    return NextResponse.json(
      { error: 'Failed to join class' },
      { status: 500 }
    )
  }
}

// DELETE - Leave a class
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Student ID and class ID are required' },
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
      message: 'Successfully left class'
    })
  } catch (error) {
    console.error('Error leaving class:', error)
    return NextResponse.json(
      { error: 'Failed to leave class' },
      { status: 500 }
    )
  }
}
