import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
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

    // Get computation settings
    let { data: settings } = await supabase
      .from('grade_computation_settings')
      .select('quiz_percentage, assignment_percentage, exam_percentage')
      .eq('class_id', classId)
      .single()

    // Create default settings if none exist
    if (!settings) {
      const { data: newSettings, error: settingsError } = await supabase
        .from('grade_computation_settings')
        .insert({
          class_id: classId,
          quiz_percentage: 30,
          assignment_percentage: 30,
          exam_percentage: 40
        })
        .select('quiz_percentage, assignment_percentage, exam_percentage')
        .single()

      if (!settingsError) {
        settings = newSettings
      }
    }

    // Get student grades from the view
    const { data: students, error: studentsError } = await supabase
      .from('student_overall_grades')
      .select('*')
      .eq('class_id', classId)
      .order('student_name')

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch student grades' }, { status: 500 })
    }

    return NextResponse.json({ 
      students: students || [],
      settings: settings || {
        quiz_percentage: 30,
        assignment_percentage: 30,
        exam_percentage: 40
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
