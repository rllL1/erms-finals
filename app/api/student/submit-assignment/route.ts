import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Submit an assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      material_id,
      student_id,
      assignment_id,
      assignment_response,
      answer_text,
      assignment_file_url
    } = body

    if (!material_id || !student_id || !assignment_id) {
      return NextResponse.json(
        { error: 'Material ID, student ID, and assignment ID are required' },
        { status: 400 }
      )
    }

    const responseText = assignment_response || answer_text
    
    if (!responseText && !assignment_file_url) {
      return NextResponse.json(
        { error: 'Either response text or file URL is required' },
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
        { error: 'You have already submitted this assignment' },
        { status: 409 }
      )
    }

    // Create submission
    const { data: submission, error: submitError } = await supabase
      .from('student_submissions')
      .insert({
        material_id,
        student_id,
        assignment_response: responseText,
        assignment_file_url,
        status: 'submitted',
        is_graded: false,
        auto_graded: false
      })
      .select()
      .single()

    if (submitError) throw submitError

    return NextResponse.json({
      message: 'Assignment submitted successfully',
      submission
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    )
  }
}

// GET - Get assignment submission
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
    console.error('Error fetching assignment submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
