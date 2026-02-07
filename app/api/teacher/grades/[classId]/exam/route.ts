import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { classId } = await params
    const { 
      student_id, 
      prelim_score, 
      midterm_score, 
      finals_score,
      max_prelim_score,
      max_midterm_score,
      max_finals_score,
      // Legacy support
      exam_score,
      max_exam_score
    } = await request.json()

    if (!student_id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify teacher owns this class
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { data: classData } = await supabase
      .from('group_classes')
      .select('id')
      .eq('id', classId)
      .eq('teacher_id', teacher.id)
      .single()

    if (!classData) {
      return NextResponse.json({ error: 'Class not found or access denied' }, { status: 404 })
    }

    // Verify student is enrolled in this class
    const { data: enrollment } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', student_id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled in this class' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      graded_by: teacher.id,
      updated_at: new Date().toISOString()
    }

    // Add scores if provided
    if (prelim_score !== undefined) {
      updateData.prelim_score = prelim_score
      updateData.max_prelim_score = max_prelim_score || 100
    }
    if (midterm_score !== undefined) {
      updateData.midterm_score = midterm_score
      updateData.max_midterm_score = max_midterm_score || 100
    }
    if (finals_score !== undefined) {
      updateData.finals_score = finals_score
      updateData.max_finals_score = max_finals_score || 100
    }
    // Legacy support
    if (exam_score !== undefined) {
      updateData.exam_score = exam_score
      updateData.max_exam_score = max_exam_score || 100
    }

    // Check if record exists first
    const { data: existingRecord } = await supabase
      .from('student_exam_scores')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', student_id)
      .single()

    let error
    if (existingRecord) {
      // Update existing record
      const result = await supabase
        .from('student_exam_scores')
        .update(updateData)
        .eq('class_id', classId)
        .eq('student_id', student_id)
      error = result.error
    } else {
      // Insert new record
      const result = await supabase
        .from('student_exam_scores')
        .insert({
          class_id: classId,
          student_id: student_id,
          ...updateData
        })
      error = result.error
    }

    if (error) {
      console.error('Exam score update error:', error)
      return NextResponse.json({ error: `Failed to save exam score: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
