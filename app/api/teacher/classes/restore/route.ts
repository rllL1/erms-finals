import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Restore an archived class
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { classId } = body

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      )
    }

    // Verify the class exists and belongs to the teacher
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { data: classData, error: classError } = await supabase
      .from('group_classes')
      .select('id, teacher_id, class_name, archived_at')
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (classData.teacher_id !== teacher.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!classData.archived_at) {
      return NextResponse.json({ error: 'Class is not archived' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('group_classes')
      .update({
        archived_at: null,
        auto_delete_at: null,
      })
      .eq('id', classId)

    if (updateError) throw updateError

    return NextResponse.json({
      message: `Class "${classData.class_name}" restored successfully`,
    })
  } catch (error) {
    console.error('Error restoring class:', error)
    return NextResponse.json(
      { error: 'Failed to restore class' },
      { status: 500 }
    )
  }
}
