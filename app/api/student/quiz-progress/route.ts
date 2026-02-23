import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET - Load saved quiz progress (draft answers + start time)
 * Query params: studentId, materialId
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const materialId = searchParams.get('materialId')

    if (!studentId || !materialId) {
      return NextResponse.json(
        { error: 'studentId and materialId are required' },
        { status: 400 }
      )
    }

    // Check if already submitted — if so, no draft needed
    const { data: existingSubmission } = await supabase
      .from('student_submissions')
      .select('id')
      .eq('material_id', materialId)
      .eq('student_id', studentId)
      .single()

    if (existingSubmission) {
      return NextResponse.json({
        alreadySubmitted: true,
        submissionId: existingSubmission.id,
        draft: null,
      })
    }

    // Look for saved draft
    const { data: draft } = await supabase
      .from('quiz_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('material_id', materialId)
      .single()

    return NextResponse.json({
      alreadySubmitted: false,
      draft: draft || null,
    })
  } catch (error) {
    console.error('Error loading quiz progress:', error)
    return NextResponse.json(
      { error: 'Failed to load quiz progress' },
      { status: 500 }
    )
  }
}

/**
 * POST - Save quiz progress (draft answers + start time)
 * Body: { studentId, materialId, quizId, answers, startTime }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { studentId, materialId, quizId, answers, startTime } = body

    if (!studentId || !materialId || !quizId) {
      return NextResponse.json(
        { error: 'studentId, materialId, and quizId are required' },
        { status: 400 }
      )
    }

    // Check if already submitted — don't save drafts for submitted quizzes
    const { data: existingSubmission } = await supabase
      .from('student_submissions')
      .select('id')
      .eq('material_id', materialId)
      .eq('student_id', studentId)
      .single()

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Quiz already submitted', alreadySubmitted: true },
        { status: 409 }
      )
    }

    // Upsert the draft progress
    const { data, error } = await supabase
      .from('quiz_progress')
      .upsert(
        {
          student_id: studentId,
          material_id: materialId,
          quiz_id: quizId,
          answers: answers || {},
          start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'student_id,material_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error saving quiz progress:', error)
      throw error
    }

    return NextResponse.json({ saved: true, progress: data })
  } catch (error) {
    console.error('Error saving quiz progress:', error)
    return NextResponse.json(
      { error: 'Failed to save quiz progress' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Clear quiz progress after submission
 * Query params: studentId, materialId
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const materialId = searchParams.get('materialId')

    if (!studentId || !materialId) {
      return NextResponse.json(
        { error: 'studentId and materialId are required' },
        { status: 400 }
      )
    }

    await supabase
      .from('quiz_progress')
      .delete()
      .eq('student_id', studentId)
      .eq('material_id', materialId)

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error deleting quiz progress:', error)
    return NextResponse.json(
      { error: 'Failed to delete quiz progress' },
      { status: 500 }
    )
  }
}
