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

    if (roleError || userData?.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all admins
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'admin')
      .order('email', { ascending: true });

    if (error) {
      console.error('Error fetching admins:', error);
      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }

    // Map admins to expected format
    const formattedAdmins = (admins || []).map((a: any) => ({
      id: a.id,
      full_name: 'Admin',
      email: a.email
    }));

    return NextResponse.json({ admins: formattedAdmins });
  } catch (error) {
    console.error('Error in admins route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
