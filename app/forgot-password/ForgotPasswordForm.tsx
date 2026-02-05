'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, Mail, KeyRound, Lock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

type Step = 'email' | 'otp' | 'reset' | 'success'

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Step 1: Request OTP
  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setSuccess('If an account with this email exists, you will receive an OTP shortly.')
      setStep('otp')
      setCountdown(60) // 60 seconds before allowing resend
    } catch (err) {
      console.error('Request OTP error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid OTP')
        return
      }

      setResetToken(data.resetToken)
      setSuccess('OTP verified successfully!')
      setStep('reset')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Reset Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }

      setStep('success')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP
  async function handleResendOTP() {
    if (countdown > 0) return
    await handleRequestOTP({ preventDefault: () => {} } as React.FormEvent)
  }

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'Forgot Password'
      case 'otp': return 'Enter OTP'
      case 'reset': return 'Reset Password'
      case 'success': return 'Password Reset'
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case 'email': return 'Enter your email address and we\'ll send you an OTP to reset your password.'
      case 'otp': return `We've sent a 6-digit OTP to ${email}. Please enter it below.`
      case 'reset': return 'Enter your new password below.'
      case 'success': return 'Your password has been reset successfully.'
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex">
        <div className={`${isMobile ? 'w-full' : 'max-w-[1440px]'} w-full mx-auto flex ${isMobile ? 'flex-col' : ''}`}>
          {/* Left Section - Form */}
          <div className={`${isMobile ? 'w-full' : 'w-[55%]'} flex flex-col`}>
            {/* Logo Section */}
            <div className={`${isSmallMobile ? 'pt-4 pl-4' : 'pt-8 pl-8'}`}>
              <Image
                src="/sdsc-logo.png"
                alt="SDSC Logo"
                width={isSmallMobile ? 90 : 120}
                height={isSmallMobile ? 30 : 40}
                className="object-contain"
              />
            </div>

            {/* Form - Centered */}
            <div className={`flex-1 flex items-center justify-center ${isSmallMobile ? 'px-4 py-6' : isMobile ? 'px-8 py-8' : 'pl-16'}`}>
              <div className={`w-full ${isMobile ? 'max-w-[450px]' : 'max-w-[400px]'}`}>
                {/* Back Link */}
                {step !== 'success' && (
                  <Link 
                    href="/login" 
                    className={`inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 ${isSmallMobile ? 'text-xs' : 'text-sm'}`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                )}

                {/* Heading */}
                <div className={`${isSmallMobile ? 'mb-6' : 'mb-8'}`}>
                  <h1 className={`${isSmallMobile ? 'text-[24px]' : 'text-[32px]'} font-bold text-gray-900 mb-2`}>
                    {getStepTitle()}
                  </h1>
                  <p className={`${isSmallMobile ? 'text-[13px]' : 'text-[15px]'} text-gray-500`}>
                    {getStepDescription()}
                  </p>
                </div>

                {/* Success Alert */}
                {success && step !== 'success' && (
                  <div className={`mb-6 p-4 bg-green-50 border border-green-200 flex items-start gap-3 ${isSmallMobile ? 'text-xs' : ''}`}>
                    <CheckCircle className={`${isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-600 flex-shrink-0 mt-0.5`} />
                    <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-green-600`}>{success}</p>
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <div className={`mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3 ${isSmallMobile ? 'text-xs' : ''}`}>
                    <AlertCircle className={`${isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-600 flex-shrink-0 mt-0.5`} />
                    <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-red-600`}>{error}</p>
                  </div>
                )}

                {/* Step 1: Email Form */}
                {step === 'email' && (
                  <form onSubmit={handleRequestOTP} className="space-y-5">
                    <Box sx={{ width: '100%', maxWidth: '100%' }}>
                      <TextField
                        fullWidth
                        id="email"
                        name="email"
                        label="Email Address"
                        type="email"
                        required
                        autoComplete="email"
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        variant="outlined"
                        size={isSmallMobile ? 'small' : 'medium'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Mail className={isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full ${isSmallMobile ? 'h-[40px] text-sm' : 'h-[44px]'} bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-sm transition-colors flex items-center justify-center gap-2`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className={`${isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
                          Sending OTP...
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  </form>
                )}

                {/* Step 2: OTP Form */}
                {step === 'otp' && (
                  <form onSubmit={handleVerifyOTP} className="space-y-5">
                    <Box sx={{ width: '100%', maxWidth: '100%' }}>
                      <TextField
                        fullWidth
                        id="otp"
                        name="otp"
                        label="Enter 6-digit OTP"
                        type="text"
                        required
                        disabled={isLoading}
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setOtp(value)
                        }}
                        variant="outlined"
                        size={isSmallMobile ? 'small' : 'medium'}
                        inputProps={{ 
                          maxLength: 6,
                          pattern: '[0-9]*',
                          inputMode: 'numeric',
                          style: { letterSpacing: '0.5em', textAlign: 'center', fontWeight: 'bold' }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <KeyRound className={isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <button
                      type="submit"
                      disabled={isLoading || otp.length !== 6}
                      className={`w-full ${isSmallMobile ? 'h-[40px] text-sm' : 'h-[44px]'} bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-sm transition-colors flex items-center justify-center gap-2`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className={`${isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
                          Verifying...
                        </>
                      ) : (
                        'Verify OTP'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={countdown > 0 || isLoading}
                        className={`${isSmallMobile ? 'text-xs' : 'text-sm'} ${countdown > 0 ? 'text-gray-400' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {countdown > 0 ? `Resend OTP in ${countdown}s` : "Didn't receive the code? Resend OTP"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setStep('email'); setOtp(''); setError(null); setSuccess(null); }}
                      className={`w-full ${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500 hover:text-gray-700`}
                    >
                      Use a different email
                    </button>
                  </form>
                )}

                {/* Step 3: Reset Password Form */}
                {step === 'reset' && (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <Box sx={{ width: '100%', maxWidth: '100%' }}>
                      <TextField
                        fullWidth
                        id="newPassword"
                        name="newPassword"
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={isLoading}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        variant="outlined"
                        size={isSmallMobile ? 'small' : 'medium'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock className={isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                size={isSmallMobile ? 'small' : 'medium'}
                              >
                                {showPassword ? (
                                  <EyeOff className={isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                                ) : (
                                  <Eye className={isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <Box sx={{ width: '100%', maxWidth: '100%' }}>
                      <TextField
                        fullWidth
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        disabled={isLoading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        variant="outlined"
                        size={isSmallMobile ? 'small' : 'medium'}
                        error={confirmPassword !== '' && newPassword !== confirmPassword}
                        helperText={confirmPassword !== '' && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock className={isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                                size={isSmallMobile ? 'small' : 'medium'}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className={isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                                ) : (
                                  <Eye className={isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      Password must be at least 6 characters long.
                    </p>

                    <button
                      type="submit"
                      disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 6}
                      className={`w-full ${isSmallMobile ? 'h-[40px] text-sm' : 'h-[44px]'} bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-sm transition-colors flex items-center justify-center gap-2`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className={`${isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
                          Resetting Password...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </form>
                )}

                {/* Step 4: Success */}
                {step === 'success' && (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <p className={`text-center ${isSmallMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
                      Your password has been reset successfully. You can now login with your new password.
                    </p>
                    <Link
                      href="/login"
                      className={`block w-full ${isSmallMobile ? 'h-[40px] text-sm' : 'h-[44px]'} bg-green-500 hover:bg-green-600 text-white font-medium rounded-sm transition-colors flex items-center justify-center`}
                    >
                      Go to Login
                    </Link>
                  </div>
                )}

                {/* Footer Text */}
                {step !== 'success' && (
                  <div>
                    <p className={`mt-8 text-center ${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      Remember your password?{' '}
                      <Link href="/login" className="text-green-600 hover:text-green-700">
                        Login here
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Background Image (Hidden on mobile) */}
          {!isMobile && (
            <div className="w-[45%] relative overflow-hidden">
              <Image
                src="/bg-sdsc.png"
                alt="Background"
                fill
                className="object-cover object-center"
                priority
              />
              <div className="absolute top-8 right-8 flex gap-3 z-10">
                <Image
                  src="/2-re.png"
                  alt="Institution Seal 1"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <Image
                  src="/234.png"
                  alt="Institution Seal 2"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
