import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch submissions for a material
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string; materialId: string }> }
) {
  try {
    const supabase = await createClient()
    const { materialId } = await params

    const { data: submissions, error } = await supabase
      .from('student_submissions')
      .select(`
        *,
        students (
          id,
          student_name,
          email
        )
      `)
      .eq('material_id', materialId)
      .order('submitted_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// PUT - Grade a submission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string; materialId: string }> }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { submission_id, score, max_score, teacher_id, feedback } = body

    if (!submission_id || score === undefined || !max_score) {
      return NextResponse.json(
        { error: 'Submission ID, score, and max score are required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      score,
      max_score,
      is_graded: true,
      status: 'graded',
      graded_at: new Date().toISOString(),
      graded_by: teacher_id,
    }

    // Include feedback if provided (can be empty string to clear)
    if (feedback !== undefined) {
      updateData.feedback = feedback || null
    }

    const { data: gradedSubmission, error } = await supabase
      .from('student_submissions')
      .update(updateData)
      .eq('id', submission_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      message: 'Submission graded successfully',
      submission: gradedSubmission
    })
  } catch (error) {
    console.error('Error grading submission:', error)
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    )
  }
}
