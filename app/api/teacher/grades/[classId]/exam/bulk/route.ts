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
    const { scores } = await request.json()

    if (!scores || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'Scores array is required' }, { status: 400 })
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

    let savedCount = 0

    for (const score of scores) {
      const { student_id, prelim_score, midterm_score, finals_score, portfolio_score } = score

      if (!student_id) continue

      const updateData: Record<string, unknown> = {
        graded_by: teacher.id,
        updated_at: new Date().toISOString()
      }

      // Parse and validate scores
      if (prelim_score !== undefined && prelim_score !== null && prelim_score !== '') {
        const val = parseFloat(String(prelim_score))
        if (!isNaN(val) && val >= 0 && val <= 100) {
          updateData.prelim_score = val
          updateData.max_prelim_score = 100
        }
      } else {
        updateData.prelim_score = null
      }

      if (midterm_score !== undefined && midterm_score !== null && midterm_score !== '') {
        const val = parseFloat(String(midterm_score))
        if (!isNaN(val) && val >= 0 && val <= 100) {
          updateData.midterm_score = val
          updateData.max_midterm_score = 100
        }
      } else {
        updateData.midterm_score = null
      }

      if (finals_score !== undefined && finals_score !== null && finals_score !== '') {
        const val = parseFloat(String(finals_score))
        if (!isNaN(val) && val >= 0 && val <= 100) {
          updateData.finals_score = val
          updateData.max_finals_score = 100
        }
      } else {
        updateData.finals_score = null
      }

      // Handle portfolio score
      if (portfolio_score !== undefined && portfolio_score !== null && portfolio_score !== '') {
        const val = parseFloat(String(portfolio_score))
        if (!isNaN(val) && val >= 0 && val <= 100) {
          updateData.portfolio_score = val
        }
      } else if (portfolio_score === null || portfolio_score === '') {
        updateData.portfolio_score = null
      }

      // Check if record exists
      const { data: existing } = await supabase
        .from('student_exam_scores')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', student_id)
        .single()

      let error
      if (existing) {
        const result = await supabase
          .from('student_exam_scores')
          .update(updateData)
          .eq('class_id', classId)
          .eq('student_id', student_id)
        error = result.error
        // If portfolio_score column doesn't exist, retry without it
        if (error && error.message?.includes('portfolio_score')) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { portfolio_score: _p, ...dataWithout } = updateData
          const retry = await supabase
            .from('student_exam_scores')
            .update(dataWithout)
            .eq('class_id', classId)
            .eq('student_id', student_id)
          error = retry.error
        }
      } else {
        const result = await supabase
          .from('student_exam_scores')
          .insert({
            class_id: classId,
            student_id,
            ...updateData
          })
        error = result.error
        // If portfolio_score column doesn't exist, retry without it
        if (error && error.message?.includes('portfolio_score')) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { portfolio_score: _p2, ...dataWithout } = updateData
          const retry = await supabase
            .from('student_exam_scores')
            .insert({
              class_id: classId,
              student_id,
              ...dataWithout
            })
          error = retry.error
        }
      }

      if (error) {
        console.error(`Failed to save exam score for student ${student_id}:`, error)
      } else {
        savedCount++
      }
    }

    return NextResponse.json({ success: true, saved: savedCount })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
