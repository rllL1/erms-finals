import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submission_id, score } = await request.json()

    if (!submission_id || score === undefined) {
      return NextResponse.json({ error: 'Submission ID and score are required' }, { status: 400 })
    }

    // Verify teacher owns this submission's class
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get submission details
    const { data: submission } = await supabase
      .from('student_submissions')
      .select(`
        id,
        max_score,
        material_id,
        class_materials (
          class_id,
          group_classes (
            teacher_id
          )
        )
      `)
      .eq('id', submission_id)
      .single()

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Verify teacher owns the class
    const classData = submission.class_materials as any
    if (classData?.group_classes?.teacher_id !== teacher.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the score
    const { error } = await supabase
      .from('student_submissions')
      .update({
        score: score,
        is_graded: true,
        graded_at: new Date().toISOString(),
        graded_by: teacher.id,
        status: 'graded'
      })
      .eq('id', submission_id)

    if (error) {
      console.error('Score update error:', error)
      return NextResponse.json({ error: 'Failed to update score' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
