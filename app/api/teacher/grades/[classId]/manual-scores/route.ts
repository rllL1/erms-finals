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

    // Get computation settings (with new grading categories)
    let settingsData: { affective_percentage: number; summative_percentage: number; formative_percentage: number } | null = null
    try {
      const { data: settings } = await supabase
        .from('grade_computation_settings')
        .select('affective_percentage, summative_percentage, formative_percentage')
        .eq('class_id', classId)
        .single()

      if (settings) {
        settingsData = settings
      } else {
        // Create default settings
        const { data: newSettings } = await supabase
          .from('grade_computation_settings')
          .insert({
            class_id: classId,
            quiz_percentage: 10,
            assignment_percentage: 50,
            exam_percentage: 40,
            affective_percentage: 10,
            summative_percentage: 50,
            formative_percentage: 40
          })
          .select('affective_percentage, summative_percentage, formative_percentage')
          .single()

        settingsData = newSettings
      }
    } catch (settingsErr) {
      console.error('Settings error (using defaults):', settingsErr)
    }

    // Get enrolled students
    const { data: enrolledStudents, error: enrollError } = await supabase
      .from('class_students')
      .select(`
        id,
        student_id,
        students (
          id,
          student_id,
          student_name
        )
      `)
      .eq('class_id', classId)
      .order('student_id')

    if (enrollError) {
      console.error('Error fetching enrolled students:', enrollError)
      return NextResponse.json({ error: 'Failed to fetch students: ' + enrollError.message }, { status: 500 })
    }

    // Get all manual grade scores for this class (including details JSONB if available)
    let manualScores: { student_id: string; term: string; affective_score: number | null; summative_score: number | null; formative_score: number | null; details?: Record<string, unknown> }[] = []
    try {
      // Try fetching with details column first
      let data, scoresError
      const result1 = await supabase
        .from('grade_manual_scores')
        .select('student_id, term, affective_score, summative_score, formative_score, details')
        .eq('class_id', classId)
      
      if (result1.error && result1.error.message?.includes('details')) {
        // details column doesn't exist yet, fetch without it
        const result2 = await supabase
          .from('grade_manual_scores')
          .select('student_id, term, affective_score, summative_score, formative_score')
          .eq('class_id', classId)
        data = result2.data
        scoresError = result2.error
      } else {
        data = result1.data
        scoresError = result1.error
      }

      if (scoresError) {
        console.error('Error fetching manual scores:', scoresError)
        // Don't fail — just show empty scores
      } else {
        manualScores = data || []
      }
    } catch (scoresErr) {
      console.error('Scores fetch error (continuing with empty):', scoresErr)
    }

    // Organize scores by student_id and term
    const scoresByStudent: Record<string, Record<string, { affective_score: number | null; summative_score: number | null; formative_score: number | null; details?: Record<string, unknown> }>> = {}
    manualScores.forEach((score) => {
      if (!scoresByStudent[score.student_id]) {
        scoresByStudent[score.student_id] = {}
      }
      scoresByStudent[score.student_id][score.term] = {
        affective_score: score.affective_score,
        summative_score: score.summative_score,
        formative_score: score.formative_score,
        details: score.details || {}
      }
    })

    // Fetch exam scores from student_exam_scores table
    const examScoresMap: Record<string, { prelim_score: number | null; midterm_score: number | null; finals_score: number | null; portfolio_score: number | null }> = {}
    try {
      // Try fetching with portfolio_score first
      let examData, examError
      const result1 = await supabase
        .from('student_exam_scores')
        .select('student_id, prelim_score, midterm_score, finals_score, portfolio_score')
        .eq('class_id', classId)
      
      if (result1.error && result1.error.message?.includes('portfolio_score')) {
        const result2 = await supabase
          .from('student_exam_scores')
          .select('student_id, prelim_score, midterm_score, finals_score')
          .eq('class_id', classId)
        examData = result2.data
        examError = result2.error
      } else {
        examData = result1.data
        examError = result1.error
      }

      if (examError) {
        console.error('Error fetching exam scores:', examError)
      } else if (examData) {
        examData.forEach((row: { student_id: string; prelim_score: number | null; midterm_score: number | null; finals_score: number | null; portfolio_score?: number | null }) => {
          examScoresMap[row.student_id] = {
            prelim_score: row.prelim_score,
            midterm_score: row.midterm_score,
            finals_score: row.finals_score,
            portfolio_score: row.portfolio_score ?? null
          }
        })
      }
    } catch (examErr) {
      console.error('Exam scores fetch error (continuing with empty):', examErr)
    }

    // Build student data with scores
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const students = (enrolledStudents || []).map((enrollment: any) => {
      const student = enrollment.students
      if (!student) return null
      const studentScores = scoresByStudent[student.id] || {}
      const examScores = examScoresMap[student.id] || { prelim_score: null, midterm_score: null, finals_score: null, portfolio_score: null }

      return {
        enrollment_id: enrollment.id,
        student_id: student.id,
        student_number: student.student_id,
        student_name: student.student_name,
        scores: {
          prelim: studentScores.prelim || { affective_score: null, summative_score: null, formative_score: null, details: {} },
          midterm: studentScores.midterm || { affective_score: null, summative_score: null, formative_score: null, details: {} },
          finals: studentScores.finals || { affective_score: null, summative_score: null, formative_score: null, details: {} }
        },
        exam_scores: examScores
      }
    }).filter(Boolean)

    return NextResponse.json({
      students,
      settings: {
        affective_percentage: settingsData?.affective_percentage ?? 10,
        summative_percentage: settingsData?.summative_percentage ?? 50,
        formative_percentage: settingsData?.formative_percentage ?? 40
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

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
    const { student_id, term, affective_score, summative_score, formative_score } = body

    // Validate inputs
    if (!student_id || !term) {
      return NextResponse.json({ error: 'Student ID and term are required' }, { status: 400 })
    }

    if (!['prelim', 'midterm', 'finals'].includes(term)) {
      return NextResponse.json({ error: 'Term must be prelim, midterm, or finals' }, { status: 400 })
    }

    // Validate score ranges
    const validateScore = (score: string | number | null | undefined, name: string) => {
      if (score !== null && score !== undefined && score !== '') {
        const num = parseFloat(String(score))
        if (isNaN(num) || num < 0 || num > 100) {
          return `${name} must be between 0 and 100`
        }
      }
      return null
    }

    const affErr = validateScore(affective_score, 'Affective score')
    const sumErr = validateScore(summative_score, 'Summative score')
    const formErr = validateScore(formative_score, 'Formative score')
    if (affErr || sumErr || formErr) {
      return NextResponse.json({ error: affErr || sumErr || formErr }, { status: 400 })
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

    // Verify student is enrolled
    const { data: enrollment } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', student_id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled in this class' }, { status: 404 })
    }

    // Upsert the manual score
    const scoreData: Record<string, string | number | null> = {
      class_id: classId,
      student_id,
      term,
      updated_at: new Date().toISOString()
    }

    if (affective_score !== undefined && affective_score !== '') {
      scoreData.affective_score = parseFloat(affective_score)
    }
    if (summative_score !== undefined && summative_score !== '') {
      scoreData.summative_score = parseFloat(summative_score)
    }
    if (formative_score !== undefined && formative_score !== '') {
      scoreData.formative_score = parseFloat(formative_score)
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
      console.error('Manual score save error:', error)
      return NextResponse.json({ error: `Failed to save scores: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
