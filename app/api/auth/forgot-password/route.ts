import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetOTP } from '@/lib/email'
import crypto from 'crypto'

// Generate a secure 6-digit OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    console.log('Looking up email:', email.toLowerCase().trim())

    // Check if user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .single()

    console.log('Profile lookup result:', { profile, profileError })

    if (profileError || !profile) {
      console.log('Email not found in database:', email)
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive an OTP shortly.'
      })
    }

    // Get user's name from students or teachers table based on role
    let userName = 'User'
    if (profile.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('student_name')
        .eq('user_id', profile.id)
        .single()
      if (student) userName = student.student_name
    } else if (profile.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('teacher_name')
        .eq('user_id', profile.id)
        .single()
      if (teacher) userName = teacher.teacher_name
    } else if (profile.role === 'admin') {
      userName = 'Administrator'
    }

    console.log('Found user:', userName, profile.email)

    // Generate OTP
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Invalidate any existing OTPs for this user
    const { error: updateError } = await supabase
      .from('password_reset_otps')
      .update({ used: true })
      .eq('user_id', profile.id)
      .eq('used', false)

    if (updateError) {
      console.error('Error invalidating existing OTPs:', updateError)
      // Table might not exist - return a more helpful error
      if (updateError.code === '42P01') {
        return NextResponse.json(
          { error: 'Password reset feature is not configured. Please contact the administrator.' },
          { status: 500 }
        )
      }
    }

    // Store the new OTP
    const { error: insertError } = await supabase
      .from('password_reset_otps')
      .insert({
        user_id: profile.id,
        email: email.toLowerCase().trim(),
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (insertError) {
      console.error('Error storing OTP:', insertError)
      return NextResponse.json(
        { error: 'Failed to generate OTP. Please try again.' },
        { status: 500 }
      )
    }

    // Send OTP email
    console.log('Attempting to send OTP email to:', email)
    const emailResult = await sendPasswordResetOTP({
      to: email,
      name: userName,
      otpCode: otpCode
    })

    console.log('Email result:', emailResult)

    if (!emailResult.success) {
      console.error('Error sending OTP email:', emailResult.error)
      return NextResponse.json(
        { error: `Failed to send OTP email: ${emailResult.error}` },
        { status: 500 }
      )
    }

    console.log('OTP email sent successfully to:', email)

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive an OTP shortly.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `An error occurred: ${errorMessage}` },
      { status: 500 }
    )
  }
}
