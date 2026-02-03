import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Submit a quiz
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      material_id,
      student_id,
      quiz_id,
      answers,
      time_taken
    } = body

    if (!material_id || !student_id || !quiz_id || !answers) {
      return NextResponse.json(
        { error: 'Material ID, student ID, quiz ID, and answers are required' },
        { status: 400 }
      )
    }

    // Check if already submitted
    const { data: existingSubmission } = await supabase
      .from('student_submissions')
      .select('id')
      .eq('material_id', material_id)
      .eq('student_id', student_id)
      .single()

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this quiz' },
        { status: 409 }
      )
    }

    // Fetch quiz questions to calculate score
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions (
          id,
          question,
          question_type,
          options,
          correct_answer
        )
      `)
      .eq('id', quiz_id)
      .single()

    if (quizError || !quiz) {
      console.error('Error fetching quiz:', quizError)
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Calculate score for auto-gradable questions
    let totalScore = 0
    let maxScore = 0
    let autoGraded = true

    const gradedAnswers = quiz.quiz_questions.map((question: any) => {
      const studentAnswer = answers[question.id]
      const isCorrect = 
        question.question_type !== 'essay' &&
        String(studentAnswer).toLowerCase().trim() === 
        String(question.correct_answer).toLowerCase().trim()

      const points = 1 // Default 1 point per question since no points column
      maxScore += points

      if (question.question_type === 'essay') {
        autoGraded = false
      } else if (isCorrect) {
        totalScore += points
      }

      return {
        question_id: question.id,
        question: question.question,
        question_type: question.question_type,
        student_answer: studentAnswer,
        correct_answer: question.correct_answer,
        is_correct: question.question_type !== 'essay' ? isCorrect : null,
        points: points,
        earned_points: question.question_type === 'essay' ? null : (isCorrect ? points : 0)
      }
    })

    // Create submission
    const { data: submission, error: submitError } = await supabase
      .from('student_submissions')
      .insert({
        material_id,
        student_id,
        quiz_answers: { answers: gradedAnswers },
        score: autoGraded ? totalScore : null,
        max_score: maxScore,
        is_graded: autoGraded,
        auto_graded: autoGraded,
        status: autoGraded ? 'graded' : 'submitted'
      })
      .select()
      .single()

    if (submitError) throw submitError

    // Create quiz attempt record
    const { error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        submission_id: submission.id,
        student_id,
        quiz_id,
        answers: { answers: gradedAnswers },
        score: autoGraded ? totalScore : null,
        max_score: maxScore,
        time_taken,
        is_completed: true,
        completed_at: new Date().toISOString()
      })

    if (attemptError) console.error('Error creating quiz attempt:', attemptError)

    return NextResponse.json({
      message: 'Quiz submitted successfully',
      submission,
      results: {
        score: autoGraded ? totalScore : null,
        max_score: maxScore,
        percentage: autoGraded ? ((totalScore / maxScore) * 100).toFixed(2) : null,
        answers: gradedAnswers,
        auto_graded: autoGraded
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    )
  }
}

// GET - Get quiz submission and results
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const materialId = searchParams.get('materialId')
    const studentId = searchParams.get('studentId')

    if (!materialId || !studentId) {
      return NextResponse.json(
        { error: 'Material ID and student ID are required' },
        { status: 400 }
      )
    }

    const { data: submission, error } = await supabase
      .from('student_submissions')
      .select('*')
      .eq('material_id', materialId)
      .eq('student_id', studentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ submission: null })
      }
      throw error
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error fetching quiz submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
