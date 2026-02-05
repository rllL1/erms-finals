import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('=== Admin Records Detail API ===')
    console.log('Fetching record ID:', id)

    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('User authenticated:', !!user)

    if (!user) {
      console.log('No user found - returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('User profile:', profile)

    if (!profile || profile.role !== 'admin') {
      console.log('User is not admin - returning 403')
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Fetch quiz/exam with teacher information
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(
        `
        id,
        title,
        type,
        quiz_type,
        start_date,
        end_date,
        created_at,
        show_answer_key,
        teacher_id,
        teachers (
          id,
          teacher_name
        )
      `
      )
      .eq('id', id)
      .single()

    console.log('Quiz fetch result:', { quiz, quizError })

    if (quizError) {
      console.log('Database error:', quizError)
      return NextResponse.json({ error: 'Record not found', details: quizError }, { status: 404 })
    }

    if (!quiz) {
      console.log('No quiz found for ID:', id)
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id)
      .order('order_number', { ascending: true })

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
    }

    // Get submissions with student details
    const { data: submissions } = await supabase
      .from('quiz_submissions')
      .select(`
        id,
        submitted_at,
        score,
        status,
        student_id,
        students!inner (
          student_id,
          student_name,
          student_email
        )
      `)
      .eq('quiz_id', id)
      .order('submitted_at', { ascending: false })

    // Transform the data
    const teacherData = Array.isArray(quiz.teachers) ? quiz.teachers[0] : quiz.teachers
    const record = {
      id: quiz.id,
      title: quiz.title,
      type: quiz.type,
      quiz_type: quiz.quiz_type,
      teacher_id: quiz.teacher_id,
      teacher_name: teacherData?.teacher_name || 'Unknown Teacher',
      start_date: quiz.start_date,
      end_date: quiz.end_date,
      created_at: quiz.created_at,
      show_answer_key: quiz.show_answer_key,
      period: 'General', // Default value since column doesn't exist
      school_name: 'School Name', // Default value since column doesn't exist
      introduction: '', // Default value since column doesn't exist
      question_count: questions?.length || 0,
      submission_count: submissions?.length || 0,
      questions: questions || [],
      submissions: submissions?.map(s => {
        const studentData = Array.isArray(s.students) ? s.students[0] : s.students
        return {
          id: s.id,
          student_name: studentData?.student_name || 'Unknown Student',
          student_email: studentData?.student_email || '',
          submitted_at: s.submitted_at,
          score: s.score,
          status: s.status
        }
      }) || [],
    }

    console.log('Returning record successfully')
    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error in record detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
