import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 })
    }

    const { newPassword } = await request.json()

    if (!newPassword) {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 })
    }

    // Check for weak password patterns
    if (/^(.)\1+$/.test(newPassword)) {
      return NextResponse.json({ error: 'Password is too weak. Please use a mix of characters.' }, { status: 400 })
    }

    // Update password using Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('Password update error:', error)

      if (error.message?.includes('same_password')) {
        return NextResponse.json({ error: 'New password must be different from your current password.' }, { status: 400 })
      }

      return NextResponse.json({ error: 'Failed to change password. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully.' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 })
  }
}
