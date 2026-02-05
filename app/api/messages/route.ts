import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.admin_id !== user.id && conversation.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages with sender details
    const { data: rawMessages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Fetch sender details for each message
    const messages = await Promise.all((rawMessages || []).map(async (msg: any) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', msg.sender_id)
        .single();

      let senderName = 'Unknown';
      if (profile?.role === 'teacher') {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('teacher_name')
          .eq('user_id', msg.sender_id)
          .single();
        senderName = teacher?.teacher_name || 'Teacher';
      } else if (profile?.role === 'admin') {
        senderName = 'Admin';
      }

      return {
        ...msg,
        sender: {
          id: msg.sender_id,
          full_name: senderName,
          role: profile?.role || 'unknown'
        }
      };
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error in messages route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content } = await request.json();

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Conversation ID and content are required' }, { status: 400 });
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.admin_id !== user.id && conversation.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create message
    const { data: rawMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim()
      })
      .select('*')
      .single();

    if (messageError || !rawMessage) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Fetch sender details
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', rawMessage.sender_id)
      .single();

    let senderName = 'Unknown';
    if (profile?.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('teacher_name')
        .eq('user_id', rawMessage.sender_id)
        .single();
      senderName = teacher?.teacher_name || 'Teacher';
    } else if (profile?.role === 'admin') {
      senderName = 'Admin';
    }

    const message = {
      ...rawMessage,
      sender: {
        id: rawMessage.sender_id,
        full_name: senderName,
        role: profile?.role || 'unknown'
      }
    };

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in send message route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
