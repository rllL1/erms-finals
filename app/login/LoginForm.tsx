'use client'

import { useState, useEffect } from 'react'
import { login } from '@/lib/actions/auth'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const theme = useTheme()
  const isMobileQuery = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallMobileQuery = useMediaQuery(theme.breakpoints.down('sm'))
  
  // Only use responsive values after mount to avoid hydration mismatch
  const isMobile = mounted ? isMobileQuery : false
  const isSmallMobile = mounted ? isSmallMobileQuery : false

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
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
                <form action={handleSubmit} className="space-y-5">
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
    </div>
  )
}
