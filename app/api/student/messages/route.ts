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
    const teacherId = searchParams.get('teacherId');

    if (!classId || !teacherId) {
      return NextResponse.json({ error: 'Class ID and Teacher ID are required' }, { status: 400 });
    }

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify student is enrolled in this class
    const { data: enrollment, error: enrollError } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', student.id)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this class' }, { status: 403 });
    }

    // Verify teacher is assigned to this class
    const { data: classData, error: classError } = await supabase
      .from('group_classes')
      .select('id, teacher_id')
      .eq('id', classId)
      .eq('teacher_id', teacherId)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'Teacher is not assigned to this class' }, { status: 403 });
    }

    // Get messages
    const { data: rawMessages, error: messagesError } = await supabase
      .from('student_teacher_messages')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', student.id)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get teacher info
    const { data: teacher } = await supabase
      .from('teachers')
      .select('user_id, teacher_name')
      .eq('id', teacherId)
      .single();

    // Get student name
    const { data: studentData } = await supabase
      .from('students')
      .select('student_name')
      .eq('id', student.id)
      .single();

    // Format messages with sender info
    const messages = (rawMessages || []).map((msg: any) => {
      const isStudentMessage = msg.sender_id === user.id;
      return {
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        sender: {
          id: msg.sender_id,
          full_name: isStudentMessage 
            ? (studentData?.student_name || 'You')
            : (teacher?.teacher_name || 'Teacher'),
          role: isStudentMessage ? 'student' : 'teacher'
        }
      };
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error in student messages route:', error);
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

    const { classId, teacherId, content } = await request.json();

    if (!classId || !teacherId || !content) {
      return NextResponse.json({ error: 'Class ID, Teacher ID, and content are required' }, { status: 400 });
    }

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, student_name')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify student is enrolled in this class
    const { data: enrollment, error: enrollError } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', student.id)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this class' }, { status: 403 });
    }

    // Verify teacher is assigned to this class
    const { data: classData, error: classError } = await supabase
      .from('group_classes')
      .select('id, teacher_id')
      .eq('id', classId)
      .eq('teacher_id', teacherId)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'Teacher is not assigned to this class' }, { status: 403 });
    }

    // Create message
    const { data: newMessage, error: messageError } = await supabase
      .from('student_teacher_messages')
      .insert({
        class_id: classId,
        student_id: student.id,
        teacher_id: teacherId,
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
        full_name: student.student_name || 'You',
        role: 'student'
      }
    };

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in student messages route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
