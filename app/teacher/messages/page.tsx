import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TeacherMessagesWrapper from './TeacherMessagesWrapper';

export default async function TeacherMessagesPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Verify teacher role
  const { data: userData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || userData.role !== 'teacher') {
    redirect('/login');
  }

  return <TeacherMessagesWrapper userId={user.id} />;
}
