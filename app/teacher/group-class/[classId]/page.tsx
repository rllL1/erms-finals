import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClassDetailClient from './ClassDetailClient'

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
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

  const { classId } = await params

  return <ClassDetailClient classId={classId} teacher={teacher} />
}
