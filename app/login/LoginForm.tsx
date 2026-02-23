'use client'

import { useState, useEffect } from 'react'
import { login } from '@/lib/actions/auth'
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Modal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [redirectRole, setRedirectRole] = useState<string | null>(null)
  const theme = useTheme()
  const isMobileQuery = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallMobileQuery = useMediaQuery(theme.breakpoints.down('sm'))
  
  // Only use responsive values after mount to avoid hydration mismatch
  const isMobile = mounted ? isMobileQuery : false
  const isSmallMobile = mounted ? isSmallMobileQuery : false

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-redirect after success modal
  useEffect(() => {
    if (showSuccessModal && redirectRole) {
      const timer = setTimeout(() => {
        router.push(`/${redirectRole}/dashboard`)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [showSuccessModal, redirectRole, router])

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function clearFieldError(field: 'email' | 'password') {
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string || '').trim()
    const password = formData.get('password') as string || ''

    // Client-side validation
    const errors: { email?: string; password?: string } = {}

    if (!email && !password) {
      setError('All fields are required.')
      errors.email = ' '
      errors.password = ' '
      setFieldErrors(errors)
      return
    }
    if (!email) {
      errors.email = 'Email address is required.'
    } else if (!validateEmail(email)) {
      errors.email = 'Email format is invalid.'
    }
    if (!password) {
      errors.password = 'Password is required.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success && result?.role) {
        // Show success modal, then redirect
        setRedirectRole(result.role)
        setShowSuccessModal(true)
      }
    } catch {
      // Only show generic error for real server failures
      setError('Server error. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex">
        <div className={`${isMobile ? 'w-full' : 'max-w-[1440px]'} w-full mx-auto flex ${isMobile ? 'flex-col' : ''}`}>
          {/* Left Section - Login Form */}
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

            {/* Login Form - Centered */}
            <div className={`flex-1 flex items-center justify-center ${isSmallMobile ? 'px-4 py-6' : isMobile ? 'px-8 py-8' : 'pl-16'}`}>
              <div className={`w-full ${isMobile ? 'max-w-[450px]' : 'max-w-[400px]'}`}>
                {/* Heading */}
                <div className={`${isSmallMobile ? 'mb-6' : 'mb-8'}`}>
                  <h1 className={`${isSmallMobile ? 'text-[24px]' : 'text-[32px]'} font-bold text-gray-900 mb-2`}>
                    Welcome Back
                  </h1>
                  <p className={`${isSmallMobile ? 'text-[13px]' : 'text-[15px]'} text-gray-500`}>
                    Please login to access your account
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className={`mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3 ${isSmallMobile ? 'text-xs' : ''}`}>
                    <AlertCircle className={`${isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-600 flex-shrink-0 mt-0.5`} />
                    <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-red-600`}>{error}</p>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <Box sx={{ width: '100%', maxWidth: '100%' }}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email"
                      type="email"
                      required
                      autoComplete="email"
                      disabled={isLoading}
                      variant="outlined"
                      size={isSmallMobile ? 'small' : 'medium'}
                      error={!!fieldErrors.email && fieldErrors.email !== ' '}
                      helperText={fieldErrors.email !== ' ' ? fieldErrors.email : undefined}
                      onChange={() => clearFieldError('email')}
                    />
                  </Box>

                  {/* Password Field */}
                  <Box sx={{ width: '100%', maxWidth: '100%' }}>
                    <TextField
                      fullWidth
                      id="password"
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      variant="outlined"
                      size={isSmallMobile ? 'small' : 'medium'}
                      error={!!fieldErrors.password && fieldErrors.password !== ' '}
                      helperText={fieldErrors.password !== ' ' ? fieldErrors.password : undefined}
                      onChange={() => clearFieldError('password')}
                      InputProps={{
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

                  {/* Submit Button */}
                  <div className="flex justify-center mt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full ${isSmallMobile ? 'h-[40px] text-sm' : 'h-[44px]'} bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-sm transition-colors flex items-center justify-center gap-2`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className={`${isSmallMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </button>
                  </div>
                </form>

                {/* Forgot Password Link - Outside form to prevent form submission */}
                <div className="flex justify-end mt-3">
                  <Link 
                    href="/forgot-password" 
                    className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-green-600 hover:text-green-700`}
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Footer Text */}
                <div>
                  <p className={`mt-8 text-center ${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                    Don&apos;t have an account? Contact your administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Background Image (Hidden on mobile) */}
          {!isMobile && (
            <div className="w-[45%] relative overflow-hidden flex items-center justify-center">
              {/* Background Image */}
              <Image
                src="/bg-sdsc.png"
                alt="Background"
                width={600}
                height={600}
                className="object-contain max-w-[100%] max-h-[90%]"
                priority
              />
                
              {/* Institution Seals at top right - overlayed on image */}
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

      {/* Login Success Modal */}
      <Modal
        open={showSuccessModal}
        aria-labelledby="login-success-title"
        slotProps={{
          backdrop: {
            sx: { backgroundColor: 'rgba(0,0,0,0.5)' }
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            textAlign: 'center',
            minWidth: 320,
            maxWidth: 400,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckCircle size={36} color="#16a34a" />
          </Box>
          <Typography id="login-success-title" variant="h5" fontWeight="bold" gutterBottom>
            Login Successful
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Redirecting to your dashboard...
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
          </Box>
        </Box>
      </Modal>
    </div>
  )
}
