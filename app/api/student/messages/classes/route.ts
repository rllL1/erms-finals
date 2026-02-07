import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get classes the student is enrolled in with teacher info
    const { data: enrollments, error: enrollError } = await supabase
      .from('class_students')
      .select(`
        class_id,
        group_classes (
          id,
          class_name,
          subject,
          teacher_id,
          teacher_name,
          teachers (
            id,
            user_id,
            teacher_name
          )
        )
      `)
      .eq('student_id', student.id);

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    // Get last message and unread count for each class-teacher combination
    const classesWithMessages = await Promise.all(
      (enrollments || []).map(async (enrollment: any) => {
        const groupClass = enrollment.group_classes;
        if (!groupClass || !groupClass.teachers) return null;

        const teacherId = groupClass.teachers.id;
        const teacherUserId = groupClass.teachers.user_id;

        // Get last message
        const { data: lastMessageData } = await supabase
          .from('student_teacher_messages')
          .select('content, created_at, sender_id')
          .eq('class_id', groupClass.id)
          .eq('student_id', student.id)
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count (messages from teacher that student hasn't read)
        const { count: unreadCount } = await supabase
          .from('student_teacher_messages')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', groupClass.id)
          .eq('student_id', student.id)
          .eq('teacher_id', teacherId)
          .eq('sender_id', teacherUserId)
          .eq('is_read', false);

        return {
          class_id: groupClass.id,
          class_name: groupClass.class_name,
          subject: groupClass.subject,
          teacher_id: teacherId,
          teacher_user_id: teacherUserId,
          teacher_name: groupClass.teachers.teacher_name || groupClass.teacher_name,
          unread_count: unreadCount || 0,
          last_message: lastMessageData || null
        };
      })
    );

    // Filter out null entries and sort by last message
    const validClasses = classesWithMessages
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => {
        if (!a.last_message && !b.last_message) return 0;
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
      });

    return NextResponse.json({ classes: validClasses });
  } catch (error) {
    console.error('Error in student messages classes route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
