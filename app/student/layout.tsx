import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentSidebar from './components/StudentSidebar'
import StudentHeader from './components/StudentHeader'

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <StudentHeader 
        email={profile.email} 
        name={student?.student_name || 'Student'} 
      />
      
      <div className="flex">
        {/* Sidebar */}
        <StudentSidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  )
}
