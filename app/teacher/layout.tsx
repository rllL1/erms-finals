import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherHeader from './components/TeacherHeader'

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <TeacherHeader 
        email={profile.email} 
        name={teacher?.teacher_name || 'Teacher'} 
      />
      
      <div className="flex">
        {/* Sidebar */}
        <TeacherSidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  )
}
