import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classId, teacherId } = await request.json();

    if (!classId || !teacherId) {
      return NextResponse.json({ error: 'Class ID and Teacher ID are required' }, { status: 400 });
    }

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get teacher's user_id
    const { data: teacher } = await supabase
      .from('teachers')
      .select('user_id')
      .eq('id', teacherId)
      .single();

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Mark messages from teacher as read
    const { error: updateError } = await supabase
      .from('student_teacher_messages')
      .update({ is_read: true })
      .eq('class_id', classId)
      .eq('student_id', student.id)
      .eq('teacher_id', teacherId)
      .eq('sender_id', teacher.user_id)  // Only mark messages FROM teacher as read
      .eq('is_read', false);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mark-read route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
