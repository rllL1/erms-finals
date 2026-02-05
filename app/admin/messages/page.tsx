import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminMessagesClient from './AdminMessagesClient';

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Verify admin role
  const { data: userData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || userData.role !== 'admin') {
    redirect('/login');
  }

  return <AdminMessagesClient userId={user.id} />;
}
