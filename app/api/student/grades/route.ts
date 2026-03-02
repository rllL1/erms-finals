import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper: compute average percentage from graded submissions
function computeAverage(items: { score: number | null; max_score: number | null; is_graded: boolean }[]): number | null {
  const graded = items.filter(i => i.is_graded && i.score !== null && i.max_score !== null && i.max_score > 0)
  if (graded.length === 0) return null
  const totalPct = graded.reduce((sum, i) => sum + ((i.score! / i.max_score!) * 100), 0)
  return Math.round((totalPct / graded.length) * 100) / 100
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify this is the student's own data
    const { data: student } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('id', studentId)
      .single()

    if (!student || student.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // ── DETAILED VIEW for a specific class ──
    if (classId) {
      // Verify enrollment
      const { data: enrollment } = await supabase
        .from('class_students')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .single()

      if (!enrollment) {
        return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 })
      }

      // Get submissions scoped to this class only via join
      const { data: submissions, error: subError } = await supabase
        .from('student_submissions')
        .select(`
          id,
          score,
          max_score,
          is_graded,
          status,
          submitted_at,
          graded_at,
          class_materials!inner (
            id,
            title,
            material_type,
            class_id
          )
        `)
        .eq('student_id', studentId)
        .eq('class_materials.class_id', classId)
        .order('submitted_at', { ascending: false })

      if (subError) {
        console.error('Error fetching submissions:', subError)
        return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
      }

      const allSubs = submissions || []

      const quizzes = allSubs
        .filter((s: any) => s.class_materials?.material_type === 'quiz')
        .map((s: any) => ({
          id: s.id,
          title: s.class_materials?.title || 'Untitled Quiz',
          score: s.score,
          maxScore: s.max_score,
          isGraded: s.is_graded,
          status: s.status,
          submittedAt: s.submitted_at,
          gradedAt: s.graded_at,
        }))

      const assignments = allSubs
        .filter((s: any) => s.class_materials?.material_type === 'assignment')
        .map((s: any) => ({
          id: s.id,
          title: s.class_materials?.title || 'Untitled Assignment',
          score: s.score,
          maxScore: s.max_score,
          isGraded: s.is_graded,
          status: s.status,
          submittedAt: s.submitted_at,
          gradedAt: s.graded_at,
        }))

      // Averages
      const quizAverage = computeAverage(
        allSubs.filter((s: any) => s.class_materials?.material_type === 'quiz')
      )
      const assignmentAverage = computeAverage(
        allSubs.filter((s: any) => s.class_materials?.material_type === 'assignment')
      )

      // Exam scores
      const { data: examScores, error: examError } = await supabase
        .from('student_exam_scores')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .single()

      if (examError && examError.code !== 'PGRST116') {
        console.error('Error fetching exam scores:', examError)
      }

      // Manual scores (term-based grading)
      let manualScores: any[] = []
      try {
        const result = await supabase
          .from('grade_manual_scores')
          .select('term, affective_score, summative_score, formative_score')
          .eq('class_id', classId)
          .eq('student_id', studentId)

        if (!result.error) {
          manualScores = result.data || []
        }
      } catch {
        // table may not exist
      }

      // Computation settings
      let settings: any = null
      try {
        const result = await supabase
          .from('grade_computation_settings')
          .select('affective_percentage, summative_percentage, formative_percentage')
          .eq('class_id', classId)
          .single()

        if (!result.error && result.data) {
          settings = result.data
        }
      } catch {
        // ignore
      }

      const affPct = settings?.affective_percentage ?? 10
      const sumPct = settings?.summative_percentage ?? 50
      const frmPct = settings?.formative_percentage ?? 40

      // Compute per-term grades from manual scores
      const termGrades: Record<string, number | null> = { prelim: null, midterm: null, finals: null }
      for (const ms of manualScores) {
        const a = ms.affective_score
        const s = ms.summative_score
        const f = ms.formative_score
        if (a !== null && s !== null && f !== null) {
          termGrades[ms.term] = Math.round(((a * affPct + s * sumPct + f * frmPct) / 100) * 100) / 100
        }
      }

      // Compute final grade: ((Prelim + Midterm) / 2 + Finals) / 2
      let finalGrade: number | null = null
      if (termGrades.prelim !== null && termGrades.midterm !== null && termGrades.finals !== null) {
        finalGrade = Math.round((((termGrades.prelim + termGrades.midterm) / 2 + termGrades.finals) / 2) * 100) / 100
      }

      return NextResponse.json({
        quizzes,
        assignments,
        quizAverage,
        assignmentAverage,
        exams: examScores
          ? {
              prelimScore: examScores.prelim_score,
              midtermScore: examScores.midterm_score,
              finalsScore: examScores.finals_score,
              maxPrelimScore: examScores.max_prelim_score || 100,
              maxMidtermScore: examScores.max_midterm_score || 100,
              maxFinalsScore: examScores.max_finals_score || 100,
              portfolioScore: examScores.portfolio_score ?? null,
              gradedAt: examScores.updated_at,
            }
          : null,
        termGrades,
        finalGrade,
      })
    }

    // ── SUMMARY VIEW: all enrolled classes ──
    const { data: enrollments, error: enrollError } = await supabase
      .from('class_students')
      .select(`
        id,
        class_id,
        joined_at,
        group_classes (
          id,
          class_name,
          subject,
          teacher_name
        )
      `)
      .eq('student_id', studentId)
      .order('joined_at', { ascending: false })

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // Get all submissions
    const { data: submissions } = await supabase
      .from('student_submissions')
      .select(`
        id, score, max_score, is_graded, status,
        class_materials ( id, class_id, material_type )
      `)
      .eq('student_id', studentId)

    // Get all exam scores
    const { data: allExamScores } = await supabase
      .from('student_exam_scores')
      .select('*')
      .eq('student_id', studentId)

    // Get all manual scores
    let allManualScores: any[] = []
    try {
      const result = await supabase
        .from('grade_manual_scores')
        .select('class_id, term, affective_score, summative_score, formative_score')
        .eq('student_id', studentId)
      if (!result.error) allManualScores = result.data || []
    } catch {
      // ignore
    }

    // Get all computation settings for enrolled classes
    const classIds = (enrollments || []).map((e: any) => e.class_id)
    let allSettings: any[] = []
    if (classIds.length > 0) {
      try {
        const result = await supabase
          .from('grade_computation_settings')
          .select('class_id, affective_percentage, summative_percentage, formative_percentage')
          .in('class_id', classIds)
        if (!result.error) allSettings = result.data || []
      } catch {
        // ignore
      }
    }

    const classSummaries = (enrollments || []).map((enrollment: any) => {
      const cid = enrollment.class_id
      const classSubs = (submissions || []).filter(
        (sub: any) => sub.class_materials?.class_id === cid
      )
      const quizSubs = classSubs.filter((s: any) => s.class_materials?.material_type === 'quiz')
      const assignSubs = classSubs.filter((s: any) => s.class_materials?.material_type === 'assignment')

      const quizAverage = computeAverage(quizSubs)
      const assignmentAverage = computeAverage(assignSubs)

      const examScore = (allExamScores || []).find((e: any) => e.class_id === cid)
      const classManualScores = allManualScores.filter((m: any) => m.class_id === cid)
      const classSetting = allSettings.find((s: any) => s.class_id === cid)

      const affPct = classSetting?.affective_percentage ?? 10
      const sumPct = classSetting?.summative_percentage ?? 50
      const frmPct = classSetting?.formative_percentage ?? 40

      // Compute per-term grades
      const termGrades: Record<string, number | null> = { prelim: null, midterm: null, finals: null }
      for (const ms of classManualScores) {
        const a = ms.affective_score
        const s = ms.summative_score
        const f = ms.formative_score
        if (a !== null && s !== null && f !== null) {
          termGrades[ms.term] = Math.round(((a * affPct + s * sumPct + f * frmPct) / 100) * 100) / 100
        }
      }

      // Final grade
      let finalGrade: number | null = null
      if (termGrades.prelim !== null && termGrades.midterm !== null && termGrades.finals !== null) {
        finalGrade = Math.round((((termGrades.prelim + termGrades.midterm) / 2 + termGrades.finals) / 2) * 100) / 100
      }

      return {
        classId: cid,
        className: enrollment.group_classes?.class_name || 'Unknown Class',
        subject: enrollment.group_classes?.subject || '',
        teacherName: enrollment.group_classes?.teacher_name || '',
        quizAverage,
        assignmentAverage,
        prelimScore: examScore?.prelim_score ?? null,
        midtermScore: examScore?.midterm_score ?? null,
        finalsScore: examScore?.finals_score ?? null,
        maxPrelimScore: examScore?.max_prelim_score || 100,
        maxMidtermScore: examScore?.max_midterm_score || 100,
        maxFinalsScore: examScore?.max_finals_score || 100,
        termGrades,
        finalGrade,
      }
    })

    return NextResponse.json({ classes: classSummaries })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
