import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Bulk save manual scores for multiple students in a term
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
    const body = await request.json()
    const { term, scores } = body

    // scores: Array<{ student_id, affective_score, summative_score, formative_score }>

    if (!term || !scores || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'Term and scores array are required' }, { status: 400 })
    }

    if (!['prelim', 'midterm', 'finals'].includes(term)) {
      return NextResponse.json({ error: 'Term must be prelim, midterm, or finals' }, { status: 400 })
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

    // Save each student's scores
    let savedCount = 0
    let errorCount = 0

    for (const score of scores) {
      const { student_id, affective_score, summative_score, formative_score } = score

      if (!student_id) continue

      const scoreData: Record<string, string | number | null> = {
        class_id: classId,
        student_id,
        term,
        updated_at: new Date().toISOString()
      }

      if (affective_score !== undefined && affective_score !== null && affective_score !== '') {
        scoreData.affective_score = parseFloat(affective_score)
      } else {
        scoreData.affective_score = null
      }

      if (summative_score !== undefined && summative_score !== null && summative_score !== '') {
        scoreData.summative_score = parseFloat(summative_score)
      } else {
        scoreData.summative_score = null
      }

      if (formative_score !== undefined && formative_score !== null && formative_score !== '') {
        scoreData.formative_score = parseFloat(formative_score)
      } else {
        scoreData.formative_score = null
      }

      // Check if record exists
      const { data: existing } = await supabase
        .from('grade_manual_scores')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', student_id)
        .eq('term', term)
        .single()

      let error
      if (existing) {
        const result = await supabase
          .from('grade_manual_scores')
          .update(scoreData)
          .eq('id', existing.id)
        error = result.error
      } else {
        const result = await supabase
          .from('grade_manual_scores')
          .insert(scoreData)
        error = result.error
      }

      if (error) {
        console.error(`Error saving score for student ${student_id}:`, error)
        errorCount++
      } else {
        savedCount++
      }
    }

    return NextResponse.json({
      success: true,
      saved: savedCount,
      errors: errorCount
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
