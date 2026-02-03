import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateExamClient from './CreateExamClient'

export default async function CreateExamPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get teacher profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, teachers(*)')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.teachers || profile.teachers.length === 0) {
    redirect('/login')
  }

  return <CreateExamClient teacher={profile.teachers[0]} />
}
