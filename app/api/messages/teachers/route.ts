import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userData, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all teachers
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('user_id, teacher_name, email')
      .order('teacher_name', { ascending: true });

    if (error) {
      console.error('Error fetching teachers:', error);
      return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
    }

    // Map teachers to expected format
    const formattedTeachers = (teachers || []).map((t: any) => ({
      id: t.user_id,
      full_name: t.teacher_name,
      email: t.email
    }));

    return NextResponse.json({ teachers: formattedTeachers });
  } catch (error) {
    console.error('Error in teachers route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
