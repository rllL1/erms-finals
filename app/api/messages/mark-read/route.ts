import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Mark all messages in the conversation as read (except sender's own messages)
    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mark as read route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
