import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    console.log('Verify OTP request:', { email, otp })

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find the OTP record
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('otp_code', otp)
      .eq('used', false)
      .single()

    console.log('OTP lookup result:', { otpRecord, otpError })

    if (otpError || !otpRecord) {
      console.log('OTP not found or error:', otpError)
      return NextResponse.json(
        { error: 'Invalid OTP code. Please check and try again.' },
        { status: 400 }
      )
    }

    // Check if OTP has expired
    const expiresAt = new Date(otpRecord.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // OTP is valid - we don't need to update anything here
    // The OTP will be marked as used when the password is actually reset
    console.log('OTP verified successfully for:', email)

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: otpRecord.id // Use the OTP record ID as the reset token
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
