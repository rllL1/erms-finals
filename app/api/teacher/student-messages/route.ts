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
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    if (!classId || !studentId) {
      return NextResponse.json({ error: 'Class ID and Student ID are required' }, { status: 400 });
    }

    // Get teacher data
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, teacher_name')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Verify teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from('group_classes')
      .select('id')
      .eq('id', classId)
      .eq('teacher_id', teacher.id)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'You do not teach this class' }, { status: 403 });
    }

    // Verify student is enrolled in this class
    const { data: enrollment, error: enrollError } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Student is not enrolled in this class' }, { status: 403 });
    }

    // Get student info
    const { data: student } = await supabase
      .from('students')
      .select('user_id, student_name')
      .eq('id', studentId)
      .single();

    // Get messages
    const { data: rawMessages, error: messagesError } = await supabase
      .from('student_teacher_messages')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .eq('teacher_id', teacher.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Format messages with sender info
    const messages = (rawMessages || []).map((msg: any) => {
      const isTeacherMessage = msg.sender_id === user.id;
      return {
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        sender: {
          id: msg.sender_id,
          full_name: isTeacherMessage 
            ? (teacher.teacher_name || 'You')
            : (student?.student_name || 'Student'),
          role: isTeacherMessage ? 'teacher' : 'student'
        }
      };
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error in teacher student-messages route:', error);
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

    const { classId, studentId, content } = await request.json();

    if (!classId || !studentId || !content) {
      return NextResponse.json({ error: 'Class ID, Student ID, and content are required' }, { status: 400 });
    }

    // Get teacher data
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, teacher_name')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Verify teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from('group_classes')
      .select('id')
      .eq('id', classId)
      .eq('teacher_id', teacher.id)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'You do not teach this class' }, { status: 403 });
    }

    // Verify student is enrolled in this class
    const { data: enrollment, error: enrollError } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Student is not enrolled in this class' }, { status: 403 });
    }

    // Create message
    const { data: newMessage, error: messageError } = await supabase
      .from('student_teacher_messages')
      .insert({
        class_id: classId,
        student_id: studentId,
        teacher_id: teacher.id,
        sender_id: user.id,
        content: content.trim(),
        is_read: false
      })
      .select('*')
      .single();

    if (messageError || !newMessage) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    const message = {
      id: newMessage.id,
      content: newMessage.content,
      created_at: newMessage.created_at,
      sender_id: newMessage.sender_id,
      sender: {
        id: user.id,
        full_name: teacher.teacher_name || 'You',
        role: 'teacher'
      }
    };

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in teacher student-messages route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
