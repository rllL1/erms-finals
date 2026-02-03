'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStudent } from '@/lib/actions/admin'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AddStudentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    try {
      const result = await createStudent(formData)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
      } else {
        // Success - redirect back to users page
        router.push('/admin/users?tab=students')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/users?tab=students"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Student</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Fill in the student information below
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            '& .MuiTextField-root': { mb: 3 },
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            required
            fullWidth
            id="studentId"
            name="studentId"
            label="Student ID"
            variant="outlined"
            disabled={isLoading}
            placeholder="e.g., 2024-001"
          />

          <TextField
            required
            fullWidth
            id="studentName"
            name="studentName"
            label="Student Name"
            variant="outlined"
            disabled={isLoading}
            placeholder="e.g., John Doe"
          />

          <TextField
            required
            fullWidth
            id="course"
            name="course"
            label="Course"
            variant="outlined"
            disabled={isLoading}
            placeholder="e.g., Computer Science"
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
            placeholder="e.g., john.doe@example.com"
          />

          <TextField
            required
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            variant="outlined"
            disabled={isLoading}
            placeholder="Minimum 6 characters"
            helperText="Minimum 6 characters"
          />

          <div className="flex gap-3 mt-6">
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
              sx={{
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' },
                textTransform: 'none',
                py: 1.5,
                px: 4,
              }}
            >
              {isLoading ? 'Creating...' : 'Create Student'}
            </Button>

            <Button
              type="button"
              variant="outlined"
              onClick={() => router.push('/admin/users?tab=students')}
              disabled={isLoading}
              sx={{
                textTransform: 'none',
                py: 1.5,
                px: 4,
              }}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </div>
    </div>
  )
}
