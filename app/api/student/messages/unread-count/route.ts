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
      return NextResponse.json({ unreadCount: 0 });
    }

    // Get total unread count (messages from teachers that student hasn't read)
    const { count: unreadCount, error: countError } = await supabase
      .from('student_teacher_messages')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', student.id)
      .neq('sender_id', user.id)  // Messages not sent by the student
      .eq('is_read', false);

    if (countError) {
      console.error('Error fetching unread count:', countError);
      return NextResponse.json({ unreadCount: 0 });
    }

    return NextResponse.json({ unreadCount: unreadCount || 0 });
  } catch (error) {
    console.error('Error in unread-count route:', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
