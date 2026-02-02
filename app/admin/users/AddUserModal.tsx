'use client'

import { useState } from 'react'
import { createStudent, createTeacher } from '@/lib/actions/admin'
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'student' | 'teacher'
}

export default function AddUserModal({ isOpen, onClose, type }: AddUserModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = type === 'student' 
        ? await createStudent(formData)
        : await createTeacher(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(result.message || `${type === 'student' ? 'Student' : 'Teacher'} created successfully!`)
        router.refresh()
        // Close modal after short delay
        setTimeout(() => {
          onClose()
          setSuccess(null)
        }, 1500)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setError(null)
      setSuccess(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add {type === 'student' ? 'Student' : 'Teacher'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form action={handleSubmit} className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {type === 'student' ? (
            <>
              {/* Student ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student ID
                </label>
                <input
                  name="studentId"
                  type="text"
                  required
                  placeholder="e.g., STU001"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student Name
                </label>
                <input
                  name="studentName"
                  type="text"
                  required
                  placeholder="Full name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course
                </label>
                <input
                  name="course"
                  type="text"
                  required
                  placeholder="e.g., Computer Science"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            <>
              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employee ID
                </label>
                <input
                  name="employeeId"
                  type="text"
                  required
                  placeholder="e.g., EMP001"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
              </div>

              {/* Teacher Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teacher Name
                </label>
                <input
                  name="teacherName"
                  type="text"
                  required
                  placeholder="Full name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="email@example.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${type === 'student' ? 'Student' : 'Teacher'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
