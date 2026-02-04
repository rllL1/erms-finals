import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentLayoutClient from './components/StudentLayoutClient'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify student role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') {
    redirect('/login')
  }

  // Get student details
  const { data: student } = await supabase
    .from('students')
    .select('student_name')
    .eq('user_id', user.id)
    .single()

  return (
    <StudentLayoutClient 
      email={profile.email} 
      name={student?.student_name || 'Student'}
    >
      {children}
    </StudentLayoutClient>
  )
}
