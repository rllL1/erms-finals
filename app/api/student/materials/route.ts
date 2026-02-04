import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch materials for student's enrolled classes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get all classes the student is enrolled in
    const { data: enrolledClasses, error: classError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', student.id)

    if (classError) throw classError

    const classIds = enrolledClasses?.map(ec => ec.class_id) || []

    if (classIds.length === 0) {
      return NextResponse.json({ materials: [] })
    }

    // Get all materials for enrolled classes
    const { data: materials, error: materialsError } = await supabase
      .from('class_materials')
      .select(`
        *,
        group_classes!class_id (
          id,
          class_name,
          class_code
        ),
        quizzes!quiz_id (
          id,
          title,
          type
        ),
        student_submissions!left (
          id,
          student_id,
          submitted_at,
          score
        )
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })

    if (materialsError) throw materialsError

    // Filter out materials that have already been submitted
    const materialsWithStatus = materials?.map(material => {
      const submissions = Array.isArray(material.student_submissions) 
        ? material.student_submissions 
        : material.student_submissions 
          ? [material.student_submissions] 
          : []
      
      const studentSubmission = submissions.find(
        (sub: any) => sub.student_id === student.id
      )

      return {
        ...material,
        is_submitted: !!studentSubmission,
        submission: studentSubmission || null
      }
    }) || []

    return NextResponse.json({ materials: materialsWithStatus })
  } catch (error) {
    console.error('Error fetching student materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}
