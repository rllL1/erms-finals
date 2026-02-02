import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <AdminHeader email={profile.email} />
      
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  )
}
