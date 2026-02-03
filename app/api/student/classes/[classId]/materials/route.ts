import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch materials for a class (student view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { classId } = await params
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Verify student is enrolled in the class
    const { data: enrollment, error: enrollError } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .single()

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this class' },
        { status: 403 }
      )
    }

    // Fetch materials
    const { data: materials, error } = await supabase
      .from('class_materials')
      .select(`
        *,
        quizzes!quiz_id (
          id,
          title,
          type,
          quiz_type,
          quiz_questions (
            count
          )
        )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Check if student has submitted each material
    const materialsWithSubmissions = await Promise.all(
      (materials || []).map(async (material) => {
        const { data: submission } = await supabase
          .from('student_submissions')
          .select('*')
          .eq('material_id', material.id)
          .eq('student_id', studentId)
          .single()

        return {
          ...material,
          submission
        }
      })
    )

    return NextResponse.json({ materials: materialsWithSubmissions })
  } catch (error) {
    console.error('Error fetching class materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}
