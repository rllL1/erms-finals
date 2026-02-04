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
    const { quiz_percentage, assignment_percentage, exam_percentage } = await request.json()

    // Validate percentages
    if (quiz_percentage + assignment_percentage + exam_percentage !== 100) {
      return NextResponse.json({ error: 'Percentages must total 100%' }, { status: 400 })
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

    // Upsert settings
    const { error } = await supabase
      .from('grade_computation_settings')
      .upsert({
        class_id: classId,
        quiz_percentage,
        assignment_percentage,
        exam_percentage,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'class_id'
      })

    if (error) {
      console.error('Settings update error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
