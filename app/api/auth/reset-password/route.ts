import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { resetToken, newPassword } = await request.json()

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find the OTP record using the reset token (OTP record ID)
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('id', resetToken)
      .eq('used', false)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please start over.' },
        { status: 400 }
      )
    }

    // Check if OTP has expired (give extra 5 minutes for password reset)
    const expiresAt = new Date(otpRecord.expires_at)
    const extendedExpiry = new Date(expiresAt.getTime() + 5 * 60 * 1000)
    if (extendedExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Reset session has expired. Please start over.' },
        { status: 400 }
      )
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      otpRecord.user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    // Mark the OTP as used
    await supabase
      .from('password_reset_otps')
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq('id', resetToken)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
