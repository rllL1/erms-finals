import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // If classId is provided, get detailed grades for that class
    if (classId) {
      // Get quiz submissions
      const { data: quizSubmissions, error: quizError } = await supabase
        .from('student_submissions')
        .select(`
          id,
          score,
          max_score,
          is_graded,
          status,
          submitted_at,
          graded_at,
          class_materials (
            id,
            title,
            material_type,
            class_id,
            created_at
          )
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })

      if (quizError) {
        console.error('Error fetching quiz submissions:', quizError)
        return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
      }

      // Filter submissions for this class and separate by type
      const classSubmissions = (quizSubmissions || []).filter(
        (sub: any) => sub.class_materials?.class_id === classId
      )

      const quizzes = classSubmissions
        .filter((sub: any) => sub.class_materials?.material_type === 'quiz')
        .map((sub: any) => ({
          id: sub.id,
          title: sub.class_materials?.title || 'Untitled Quiz',
          score: sub.score,
          maxScore: sub.max_score,
          isGraded: sub.is_graded,
          status: sub.status,
          submittedAt: sub.submitted_at,
          gradedAt: sub.graded_at,
        }))

      const assignments = classSubmissions
        .filter((sub: any) => sub.class_materials?.material_type === 'assignment')
        .map((sub: any) => ({
          id: sub.id,
          title: sub.class_materials?.title || 'Untitled Assignment',
          score: sub.score,
          maxScore: sub.max_score,
          isGraded: sub.is_graded,
          status: sub.status,
          submittedAt: sub.submitted_at,
          gradedAt: sub.graded_at,
        }))

      // Get exam scores for this class
      const { data: examScores, error: examError } = await supabase
        .from('student_exam_scores')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .single()

      if (examError && examError.code !== 'PGRST116') {
        console.error('Error fetching exam scores:', examError)
      }

      return NextResponse.json({
        quizzes,
        assignments,
        exams: examScores ? {
          examName: examScores.exam_name,
          prelimScore: examScores.prelim_score,
          midtermScore: examScores.midterm_score,
          finalsScore: examScores.finals_score,
          maxPrelimScore: examScores.max_prelim_score || 100,
          maxMidtermScore: examScores.max_midterm_score || 100,
          maxFinalsScore: examScores.max_finals_score || 100,
          gradedAt: examScores.updated_at,
        } : null
      })
    }

    // Get all classes the student is enrolled in
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

    // Get all submissions for the student
    const { data: submissions, error: subError } = await supabase
      .from('student_submissions')
      .select(`
        id,
        score,
        max_score,
        is_graded,
        status,
        class_materials (
          id,
          class_id,
          material_type
        )
      `)
      .eq('student_id', studentId)

    if (subError) {
      console.error('Error fetching submissions:', subError)
    }

    // Get all exam scores for the student
    const { data: allExamScores, error: allExamError } = await supabase
      .from('student_exam_scores')
      .select('*')
      .eq('student_id', studentId)

    if (allExamError) {
      console.error('Error fetching exam scores:', allExamError)
    }

    // Calculate summary for each class
    const classSummaries = (enrollments || []).map((enrollment: any) => {
      const classId = enrollment.class_id
      const classSubmissions = (submissions || []).filter(
        (sub: any) => sub.class_materials?.class_id === classId
      )

      const quizSubmissions = classSubmissions.filter(
        (sub: any) => sub.class_materials?.material_type === 'quiz'
      )
      const assignmentSubmissions = classSubmissions.filter(
        (sub: any) => sub.class_materials?.material_type === 'assignment'
      )

      const examScore = (allExamScores || []).find((exam: any) => exam.class_id === classId)

      const gradedQuizzes = quizSubmissions.filter((sub: any) => sub.is_graded)
      const gradedAssignments = assignmentSubmissions.filter((sub: any) => sub.is_graded)

      return {
        classId: enrollment.class_id,
        className: enrollment.group_classes?.class_name || 'Unknown Class',
        subject: enrollment.group_classes?.subject || '',
        teacherName: enrollment.group_classes?.teacher_name || '',
        quizCount: quizSubmissions.length,
        quizGradedCount: gradedQuizzes.length,
        assignmentCount: assignmentSubmissions.length,
        assignmentGradedCount: gradedAssignments.length,
        hasExamScore: !!examScore,
        prelimScore: examScore?.prelim_score,
        midtermScore: examScore?.midterm_score,
        finalsScore: examScore?.finals_score,
        maxPrelimScore: examScore?.max_prelim_score || 100,
        maxMidtermScore: examScore?.max_midterm_score || 100,
        maxFinalsScore: examScore?.max_finals_score || 100,
      }
    })

    return NextResponse.json({ classes: classSummaries })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
