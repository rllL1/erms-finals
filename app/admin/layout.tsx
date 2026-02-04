import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from './components/AdminLayoutClient'

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

  return <AdminLayoutClient email={profile.email}>{children}</AdminLayoutClient>
}
