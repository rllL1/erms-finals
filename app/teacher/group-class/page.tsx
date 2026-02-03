import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupClassClient from './GroupClassClient'

export default async function GroupClassPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !teacher) {
    redirect('/login')
  }

  return <GroupClassClient teacher={teacher} />
}
