import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 })
    }

    // Support both FormData and JSON body
    let teacherName: string | null = null
    let email: string | null = null

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      teacherName = body.teacherName
      email = body.email
    } else {
      const formData = await request.formData()
      teacherName = formData.get('teacherName') as string
      email = formData.get('email') as string
    }

    // Validate required fields
    if (!teacherName?.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format. Please enter a valid email address.' }, { status: 400 })
    }

    const trimmedName = teacherName.trim()
    const trimmedEmail = email.trim().toLowerCase()

    // Check if email is already used by another user
    if (trimmedEmail !== user.email) {
      const adminSupabase = createAdminClient()

      // Check in profiles table
      const { data: existingProfile } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .neq('id', user.id)
        .maybeSingle()

      if (existingProfile) {
        return NextResponse.json({ error: 'This email address is already in use by another account.' }, { status: 409 })
      }
    }

    // Update teacher record
    const { error: teacherError } = await supabase
      .from('teachers')
      .update({
        teacher_name: trimmedName,
        email: trimmedEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (teacherError) {
      console.error('Teacher update error:', teacherError)
      if (teacherError.code === '23505') {
        return NextResponse.json({ error: 'This email address is already in use.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update profile. Please try again.' }, { status: 500 })
    }

    // Update profile email if changed
    if (trimmedEmail !== user.email) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: trimmedEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }

      // Update auth email using admin client to avoid permission issues
      const adminSupabase = createAdminClient()
      const { error: authError } = await adminSupabase.auth.admin.updateUserById(user.id, {
        email: trimmedEmail,
      })

      if (authError) {
        console.error('Auth email update error:', authError)
        return NextResponse.json({
          error: 'Profile name updated, but email change failed. The email may already be in use.'
        }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully.' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 })
  }
}
