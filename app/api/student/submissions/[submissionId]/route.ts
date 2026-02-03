import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student ID from auth user ID
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Fetch submission with material details
    const { data: submission, error: submissionError } = await supabase
      .from('student_submissions')
      .select(`
        *,
        class_materials (
          id,
          title,
          description,
          material_type
        )
      `)
      .eq('id', submissionId)
      .eq('student_id', student.id)
      .single()

    if (submissionError) {
      console.error('Error fetching submission:', submissionError)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      submission: {
        id: submission.id,
        material_id: submission.material_id,
        student_id: submission.student_id,
        score: submission.score,
        max_score: submission.max_score,
        is_graded: submission.is_graded,
        submitted_at: submission.submitted_at,
        quiz_answers: submission.quiz_answers,
        assignment_response: submission.assignment_response,
      },
      material: submission.class_materials,
    })
  } catch (error: any) {
    console.error('Error in GET /api/student/submissions/[submissionId]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
