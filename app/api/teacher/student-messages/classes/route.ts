import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get classes the teacher teaches
    const { data: classes, error: classesError } = await supabase
      .from('group_classes')
      .select(`
        id,
        class_name,
        subject
      `)
      .eq('teacher_id', teacher.id);

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    // Get students in each class with their messages
    const classesWithStudents = await Promise.all(
      (classes || []).map(async (classItem: any) => {
        // Get students enrolled in this class
        const { data: enrollments } = await supabase
          .from('class_students')
          .select(`
            student_id,
            students (
              id,
              user_id,
              student_name
            )
          `)
          .eq('class_id', classItem.id);

        // For each student, get unread count and last message
        const studentsWithMessages = await Promise.all(
          (enrollments || []).map(async (enrollment: any) => {
            const student = enrollment.students;
            if (!student) return null;

            // Get last message
            const { data: lastMessageData } = await supabase
              .from('student_teacher_messages')
              .select('content, created_at, sender_id')
              .eq('class_id', classItem.id)
              .eq('student_id', student.id)
              .eq('teacher_id', teacher.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get unread count (messages from student that teacher hasn't read)
            const { count: unreadCount } = await supabase
              .from('student_teacher_messages')
              .select('id', { count: 'exact', head: true })
              .eq('class_id', classItem.id)
              .eq('student_id', student.id)
              .eq('teacher_id', teacher.id)
              .eq('sender_id', student.user_id)
              .eq('is_read', false);

            return {
              student_id: student.id,
              student_user_id: student.user_id,
              student_name: student.student_name,
              unread_count: unreadCount || 0,
              last_message: lastMessageData || null
            };
          })
        );

        return {
          class_id: classItem.id,
          class_name: classItem.class_name,
          subject: classItem.subject,
          students: studentsWithMessages.filter((s): s is NonNullable<typeof s> => s !== null)
        };
      })
    );

    return NextResponse.json({ classes: classesWithStudents });
  } catch (error) {
    console.error('Error in teacher student-messages classes route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
