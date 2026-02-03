import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherProfileClient from './TeacherProfileClient'

export default async function TeacherProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get teacher details
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!teacher) {
    redirect('/login')
  }

  return <TeacherProfileClient teacher={teacher} />
}
