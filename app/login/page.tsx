import LoginForm from './LoginForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  // Check if user is already logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Get user role and redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role) {
      redirect(`/${profile.role}/dashboard`)
    }
  }

  return <LoginForm />
}
