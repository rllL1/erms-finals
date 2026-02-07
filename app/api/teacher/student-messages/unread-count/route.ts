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
      return NextResponse.json({ unreadCount: 0 });
    }

    // Get total unread count (messages from students that teacher hasn't read)
    const { count: unreadCount, error: countError } = await supabase
      .from('student_teacher_messages')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacher.id)
      .neq('sender_id', user.id)  // Messages not sent by the teacher
      .eq('is_read', false);

    if (countError) {
      console.error('Error fetching unread count:', countError);
      return NextResponse.json({ unreadCount: 0 });
    }

    return NextResponse.json({ unreadCount: unreadCount || 0 });
  } catch (error) {
    console.error('Error in teacher unread-count route:', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
