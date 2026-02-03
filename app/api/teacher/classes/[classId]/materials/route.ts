import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch materials for a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { classId } = await params

    const { data: materials, error } = await supabase
      .from('class_materials')
      .select(`
        *,
        quizzes!quiz_id (
          id,
          title,
          type,
          quiz_questions (
            count
          )
        )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ materials })
  } catch (error) {
    console.error('Error fetching class materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

// POST - Add material to class
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const { classId } = await params
    const body = await request.json()

    const {
      material_type,
      quiz_id,
    title,
    description,
    time_limit,
    due_date
  } = body

  // Validate required fields
  if (!material_type || !title) {
    return NextResponse.json(
      { error: 'Material type and title are required' },
      { status: 400 }
    )
  }

  if (!quiz_id) {
    return NextResponse.json(
      { error: 'Quiz/Assignment ID is required' },
      { status: 400 }
    )
  }

  const { data: material, error } = await supabase
    .from('class_materials')
    .insert({
      class_id: classId,
      material_type,
      quiz_id,
      title,
      description,
      time_limit,
      due_date
    })
    .select()
    .single()

  if (error) throw error

    return NextResponse.json({
      message: 'Material added to class successfully',
      material
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding material to class:', error)
    return NextResponse.json(
      { error: 'Failed to add material' },
      { status: 500 }
    )
  }
}

// DELETE - Remove material from class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('class_materials')
      .delete()
      .eq('id', materialId)

    if (error) throw error

    return NextResponse.json({
      message: 'Material removed from class successfully'
    })
  } catch (error) {
    console.error('Error removing material:', error)
    return NextResponse.json(
      { error: 'Failed to remove material' },
      { status: 500 }
    )
  }
}
