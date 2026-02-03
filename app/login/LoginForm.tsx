'use client'

import { useState } from 'react'
import { login } from '@/lib/actions/auth'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex">
        <div className="max-w-[1440px] w-full mx-auto flex">
          {/* Left Section - Login Form (55%) */}
          <div className="w-[55%] flex flex-col">
            {/* Logo Section - No padding, at top */}
            <div className="pt-8 pl-8">
              <Image
                src="/sdsc-logo.png"
                alt="SDSC Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>

            {/* Login Form - Left aligned */}
            <div className="flex-1 flex items-center pl-16">
              <div className="w-full max-w-[400px]">
                {/* Heading */}
                <div className="mb-8">
                <h1 className="text-[32px] font-bold text-gray-900 mb-2">
                  Welcome Back
                </h1>
                <p className="text-[15px] text-gray-500">
                  Please login to access your account
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form action={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <Box sx={{ width: '150%', maxWidth: '150%' }}>
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
                  />
                </Box>

                {/* Password Field */}
                <Box sx={{ width: '150%', maxWidth: '150%' }}>
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    variant="outlined"
                  />
                </Box>

                {/* Forgot Password Link */}
                <div style={{ width: '150%', maxWidth: '150%' }} className="flex justify-end -mt-3">
                  <a 
                    href="#" 
                    className="text-sm text-green-600 hover:text-green-700"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-6" style={{ width: '150%', maxWidth: '150%' }}>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[44px] bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </div>
              </form>

              {/* Footer Text */}
              <div style={{ width: '150%', maxWidth: '150%' }}>
                <p className="mt-8 text-center text-sm text-gray-500">
                  Don&apos;t have an account? Contact your administrator.
                </p>
              </div>
              </div>
            </div>
          </div>

          {/* Right Section - Background Image (45%) */}
          <div className="w-[45%] relative overflow-hidden">
            {/* Background Image */}
            <Image
              src="/bg-sdsc.png"
              alt="Background"
              fill
              className="object-cover object-center"
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
        </div>
      </div>
    </div>
  )
}
