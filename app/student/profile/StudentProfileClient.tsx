'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { User, Lock } from 'lucide-react'

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

  async function handleProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/student/update-profile', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Profile updated successfully!')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(event.currentTarget)
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/student/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Password changed successfully!')
        event.currentTarget.reset()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
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
                helperText="Minimum 6 characters"
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
    </div>
  )
}
