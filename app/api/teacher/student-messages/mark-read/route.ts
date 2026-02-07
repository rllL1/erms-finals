import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classId, studentId } = await request.json();

    if (!classId || !studentId) {
      return NextResponse.json({ error: 'Class ID and Student ID are required' }, { status: 400 });
    }

    // Get teacher data
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get student's user_id
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Mark messages from student as read
    const { error: updateError } = await supabase
      .from('student_teacher_messages')
      .update({ is_read: true })
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .eq('teacher_id', teacher.id)
      .eq('sender_id', student.user_id)  // Only mark messages FROM student as read
      .eq('is_read', false);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in teacher mark-read route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
