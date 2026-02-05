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

    if (roleError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userData.role !== 'admin' && userData.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get unread message count
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`admin_id.eq.${user.id},teacher_id.eq.${user.id}`);

    if (convError) {
      console.error('Error fetching conversations for unread count:', convError);
      return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
    }

    const conversationIds = conversations?.map(c => c.id) || [];

    if (conversationIds.length === 0) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    if (countError) {
      console.error('Error counting unread messages:', countError);
      return NextResponse.json({ error: 'Failed to count unread messages' }, { status: 500 });
    }

    return NextResponse.json({ unreadCount: count || 0 });
  } catch (error) {
    console.error('Error in unread count route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
