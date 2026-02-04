import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const studentName = formData.get('studentName') as string
    const email = formData.get('email') as string
    const course = formData.get('course') as string

    if (!studentName || !email || !course) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Update student record
    const { error: studentError } = await supabase
      .from('students')
      .update({
        student_name: studentName,
        email: email,
        course: course,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (studentError) {
      console.error('Student update error:', studentError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Update profile email if changed
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (profile && profile.email !== email) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }

      // Update auth email
      const { error: authError } = await supabase.auth.updateUser({
        email: email,
      })

      if (authError) {
        console.error('Auth email update error:', authError)
        return NextResponse.json({ 
          error: 'Profile updated but email change failed. Please try again.' 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
