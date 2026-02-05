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

    // Get conversations with user details and last message
    let query = supabase
      .from('conversations')
      .select(`
        *,
        messages(
          id,
          content,
          created_at,
          is_read,
          sender_id
        )
      `)
      .order('updated_at', { ascending: false });

    // Filter based on role
    if (userData.role === 'admin') {
      query = query.eq('admin_id', user.id);
    } else if (userData.role === 'teacher') {
      query = query.eq('teacher_id', user.id);
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: conversations, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Fetch teacher and admin data separately
    const processedConversations = await Promise.all(conversations?.map(async (conv) => {
      const messages = conv.messages || [];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      const unreadCount = messages.filter((m: any) => !m.is_read && m.sender_id !== user.id).length;

      // Get admin profile
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', conv.admin_id)
        .single();

      // Get teacher data
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('user_id, teacher_name, email')
        .eq('user_id', conv.teacher_id)
        .single();

      return {
        ...conv,
        admin: adminProfile ? { id: adminProfile.id, full_name: 'Admin', email: adminProfile.email } : null,
        teacher: teacherData ? { id: teacherData.user_id, full_name: teacherData.teacher_name, email: teacherData.email } : null,
        lastMessage,
        unreadCount,
        messages: undefined // Remove full messages array from response
      };
    }) || []);

    return NextResponse.json({ conversations: processedConversations });
  } catch (error) {
    console.error('Error in conversations route:', error);
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

    const body = await request.json();
    const { teacherId, adminId } = body;

    // Get user role
    const { data: userData, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let conversationAdminId: string;
    let conversationTeacherId: string;

    // Determine admin and teacher IDs based on role
    if (userData.role === 'admin') {
      if (!teacherId) {
        return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
      }
      conversationAdminId = user.id;
      conversationTeacherId = teacherId;
    } else if (userData.role === 'teacher') {
      if (!adminId) {
        return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
      }
      conversationAdminId = adminId;
      conversationTeacherId = user.id;
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 });
    }

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .eq('admin_id', conversationAdminId)
      .eq('teacher_id', conversationTeacherId)
      .single();

    if (existingConv) {
      return NextResponse.json({ conversation: existingConv });
    }

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        admin_id: conversationAdminId,
        teacher_id: conversationTeacherId
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json({ conversation: newConv });
  } catch (error) {
    console.error('Error in create conversation route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
