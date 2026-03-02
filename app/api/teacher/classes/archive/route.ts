import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Archive a class (soft delete with retention)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { classId, retentionDays = 30 } = body

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
      .select('id, teacher_id, class_name')
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (classData.teacher_id !== teacher.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const now = new Date()
    const autoDeleteAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000)

    const { error: updateError } = await supabase
      .from('group_classes')
      .update({
        archived_at: now.toISOString(),
        auto_delete_at: autoDeleteAt.toISOString(),
      })
      .eq('id', classId)

    if (updateError) throw updateError

    return NextResponse.json({
      message: `Class "${classData.class_name}" archived successfully`,
      archived_at: now.toISOString(),
      auto_delete_at: autoDeleteAt.toISOString(),
    })
  } catch (error) {
    console.error('Error archiving class:', error)
    return NextResponse.json(
      { error: 'Failed to archive class' },
      { status: 500 }
    )
  }
}
