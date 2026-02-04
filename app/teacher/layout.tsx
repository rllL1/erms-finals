import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherLayoutClient from './components/TeacherLayoutClient'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify teacher role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    redirect('/login')
  }

  // Get teacher details
  const { data: teacher } = await supabase
    .from('teachers')
    .select('teacher_name')
    .eq('user_id', user.id)
    .single()

  return (
    <TeacherLayoutClient 
      email={profile.email} 
      name={teacher?.teacher_name || 'Teacher'}
    >
      {children}
    </TeacherLayoutClient>
  )
}
