import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MaterialSubmissionsClient from './MaterialSubmissionsClient'

export default async function MaterialSubmissionsPage({
  params,
}: {
  params: Promise<{ classId: string; materialId: string }>
}) {
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

  const { classId, materialId } = await params

  return (
    <MaterialSubmissionsClient
      classId={classId}
      materialId={materialId}
      teacher={teacher}
    />
  )
}
