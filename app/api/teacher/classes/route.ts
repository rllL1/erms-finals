import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all classes for a teacher
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const teacherId = searchParams.get('teacherId')
    const includeArchived = searchParams.get('includeArchived') === 'true'

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Auto-delete expired archived classes
    await supabase
      .from('group_classes')
      .delete()
      .eq('teacher_id', teacherId)
      .not('auto_delete_at', 'is', null)
      .lt('auto_delete_at', new Date().toISOString())

    // Build query
    let query = supabase
      .from('group_classes')
      .select(`
        *,
        class_students (
          id,
          student_id,
          joined_at
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (!includeArchived) {
      query = query.is('archived_at', null)
    }

    const { data: classes, error } = await query

    if (error) throw error

    // Add student count to each class
    const classesWithCount = classes?.map(cls => ({
      ...cls,
      student_count: cls.class_students?.length || 0
    }))

    // Separate active and archived
    const activeClasses = classesWithCount?.filter(cls => !cls.archived_at) || []
    const archivedClasses = classesWithCount?.filter(cls => cls.archived_at) || []

    return NextResponse.json({
      classes: includeArchived ? classesWithCount : activeClasses,
      activeClasses,
      archivedClasses,
    })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}

// POST - Create a new class
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      teacher_id,
      class_name,
      subject,
      department,
      year_level,
      class_start_time,
      class_end_time,
      teacher_name
    } = body

    // Validate required fields
    if (!teacher_id || !class_name || !subject || !class_start_time || !class_end_time || !teacher_name) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }



    // Validate time
    if (class_end_time <= class_start_time) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Check for duplicate subject for the same teacher (excluding archived)
    const { data: existingSubjects } = await supabase
      .from('group_classes')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('subject', subject)
      .is('archived_at', null)

    if (existingSubjects && existingSubjects.length > 0) {
      return NextResponse.json(
        { error: 'You already have a class with this subject' },
        { status: 409 }
      )
    }

    // Check for duplicate time slot for the same teacher (excluding archived)
    const { data: existingTimes } = await supabase
      .from('group_classes')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('class_start_time', class_start_time)
      .eq('class_end_time', class_end_time)
      .is('archived_at', null)

    if (existingTimes && existingTimes.length > 0) {
      return NextResponse.json(
        { error: 'You already have a class at this time slot' },
        { status: 409 }
      )
    }

    // Generate unique class code using the database function
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_class_code')

    if (codeError) throw codeError

    // Create the class
    const { data: newClass, error: createError } = await supabase
      .from('group_classes')
      .insert({
        teacher_id,
        class_name,
        subject,
        department: department || null,
        year_level: year_level || null,
        class_start_time,
        class_end_time,
        teacher_name,
        class_code: codeData
      })
      .select()
      .single()

    if (createError) throw createError

    return NextResponse.json({
      message: 'Class created successfully',
      class: newClass
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    )
  }
}
