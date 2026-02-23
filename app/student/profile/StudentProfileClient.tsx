'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { User, Lock } from 'lucide-react'
import NotificationModal from '@/app/components/NotificationModal'

interface StudentProfileClientProps {
  student: {
    student_name: string
    student_id: string
    email: string
    course: string
  }
}

export default function StudentProfileClient({ student }: StudentProfileClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Notification modal for success messages
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function validateProfileFields(name: string, email: string, course: string): boolean {
    const errors: Record<string, string> = {}

    if (!name.trim()) {
      errors.studentName = 'Full name is required.'
    }
    if (!email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }
    if (!course.trim()) {
      errors.course = 'Course is required.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const formData = new FormData(event.currentTarget)
    const studentName = (formData.get('studentName') as string) || ''
    const email = (formData.get('email') as string) || ''
    const course = (formData.get('course') as string) || ''

    if (!validateProfileFields(studentName, email, course)) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/student/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName.trim(),
          email: email.trim(),
          course: course.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setError(result.error || 'Failed to update profile. Please try again.')
      } else {
        setSuccess(result.message || 'Profile updated successfully!')
        setSnackbarOpen(true)
        setFieldErrors({})
        router.refresh()
      }
    } catch {
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const formData = new FormData(event.currentTarget)
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    const errors: Record<string, string> = {}

    if (!newPassword) {
      errors.newPassword = 'New password is required.'
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long.'
    } else if (/^(.)\1+$/.test(newPassword)) {
      errors.newPassword = 'Password is too weak. Please use a mix of characters.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/student/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setError(result.error || 'Failed to change password. Please try again.')
      } else {
        setSuccess(result.message || 'Password changed successfully!')
        setSnackbarOpen(true)
        setFieldErrors({})
        ;(event.target as HTMLFormElement).reset()
      }
    } catch {
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function clearFieldError(field: string) {
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account information and security
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-green-600 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <User className="w-4 h-4" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-green-600 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Lock className="w-4 h-4" />
              Change Password
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Success/Error Alerts */}
          {error && (
            <Alert severity="error" className="mb-6">
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" className="mb-6">
              {success}
            </Alert>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Box
              component="form"
              onSubmit={handleProfileUpdate}
              sx={{ '& .MuiTextField-root': { mb: 3 } }}
              noValidate
              autoComplete="off"
            >
              <TextField
                required
                fullWidth
                id="studentName"
                name="studentName"
                label="Full Name"
                variant="outlined"
                disabled={isLoading}
                defaultValue={student.student_name}
                error={!!fieldErrors.studentName}
                helperText={fieldErrors.studentName}
                onChange={() => clearFieldError('studentName')}
              />

              <TextField
                required
                fullWidth
                id="studentId"
                name="studentId"
                label="Student ID"
                variant="outlined"
                disabled
                defaultValue={student.student_id}
                helperText="Student ID cannot be changed"
              />

              <TextField
                required
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                variant="outlined"
                disabled={isLoading}
                defaultValue={student.email}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                onChange={() => clearFieldError('email')}
              />

              <TextField
                required
                fullWidth
                id="course"
                name="course"
                label="Course"
                variant="outlined"
                disabled={isLoading}
                defaultValue={student.course}
                error={!!fieldErrors.course}
                helperText={fieldErrors.course}
                onChange={() => clearFieldError('course')}
              />

              <div className="flex gap-3 mt-6">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : null}
                  sx={{
                    bgcolor: '#16a34a',
                    '&:hover': { bgcolor: '#15803d' },
                    textTransform: 'none',
                    py: 1.5,
                    px: 4,
                  }}
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </Box>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <Box
              component="form"
              onSubmit={handlePasswordChange}
              sx={{ '& .MuiTextField-root': { mb: 3 } }}
              noValidate
              autoComplete="off"
            >
              <TextField
                required
                fullWidth
                id="newPassword"
                name="newPassword"
                label="New Password"
                type="password"
                variant="outlined"
                disabled={isLoading}
                helperText={fieldErrors.newPassword || 'Minimum 6 characters'}
                error={!!fieldErrors.newPassword}
                onChange={() => clearFieldError('newPassword')}
              />

              <TextField
                required
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                variant="outlined"
                disabled={isLoading}
                error={!!fieldErrors.confirmPassword}
                helperText={fieldErrors.confirmPassword}
                onChange={() => clearFieldError('confirmPassword')}
              />

              <div className="flex gap-3 mt-6">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : null}
                  sx={{
                    bgcolor: '#16a34a',
                    '&:hover': { bgcolor: '#15803d' },
                    textTransform: 'none',
                    py: 1.5,
                    px: 4,
                  }}
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </Box>
          )}
        </div>
      </div>

      {/* Success Notification Modal */}
      <NotificationModal
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={success || 'Operation completed successfully!'}
        severity="success"
        autoCloseMs={2500}
      />
    </div>
  )
}
