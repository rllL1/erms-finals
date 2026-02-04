import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GradesClient from './GradesClient'

export default async function GradesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get teacher details
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, teacher_name')
    .eq('user_id', user.id)
    .single()

  if (!teacher) {
    redirect('/login')
  }

  // Get all classes for this teacher
  const { data: classes } = await supabase
    .from('group_classes')
    .select('id, class_name, subject, class_code')
    .eq('teacher_id', teacher.id)
    .order('class_name')

  return <GradesClient teacherId={teacher.id} classes={classes || []} />
}
