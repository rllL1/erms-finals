import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface QuizRecord {
  id: string
  title: string
  type: string
  quiz_type: string
  start_date: string
  end_date: string
  created_at: string
  teacher_id: string
  teachers: { id: string; teacher_name: string } | { id: string; teacher_name: string }[]
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Fetch all quizzes/exams with teacher information
    const { data: quizzes, error: quizzesError } = await supabase
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
        teacher_id,
        teachers!inner (
          id,
          teacher_name
        )
      `
      )
      .order('created_at', { ascending: false })

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
    }

    // Get question counts for each quiz
    const { data: questionCounts } = await supabase
      .from('quiz_questions')
      .select('quiz_id')

    const questionCountMap = new Map<string, number>()
    questionCounts?.forEach((q) => {
      questionCountMap.set(q.quiz_id, (questionCountMap.get(q.quiz_id) || 0) + 1)
    })

    // Get submission counts for each quiz
    const { data: submissions } = await supabase
      .from('quiz_submissions')
      .select('quiz_id')

    const submissionCountMap = new Map<string, number>()
    submissions?.forEach((s) => {
      submissionCountMap.set(s.quiz_id, (submissionCountMap.get(s.quiz_id) || 0) + 1)
    })

    // Transform the data
    const records = (quizzes as QuizRecord[]).map((quiz) => {
      const teacherData = Array.isArray(quiz.teachers) ? quiz.teachers[0] : quiz.teachers
      return {
        id: quiz.id,
        title: quiz.title,
        type: quiz.type,
        quiz_type: quiz.quiz_type,
        teacher_id: quiz.teacher_id,
        teacher_name: teacherData?.teacher_name || 'Unknown Teacher',
        start_date: quiz.start_date,
        end_date: quiz.end_date,
        created_at: quiz.created_at,
        question_count: questionCountMap.get(quiz.id) || 0,
        submission_count: submissionCountMap.get(quiz.id) || 0,
      }
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Error in records API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
