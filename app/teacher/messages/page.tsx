import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TeacherMessagesClient from './TeacherMessagesClient';

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

  return <TeacherMessagesClient userId={user.id} />;
}
