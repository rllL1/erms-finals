import { createClient } from '@/lib/supabase/server'
import { BookOpen, Calendar } from 'lucide-react'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get student details
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {student?.student_name || 'Student'}!
        </h1>
        <p className="text-green-100 mt-1">
          Student ID: {student?.student_id || 'N/A'} | Course: {student?.course || 'N/A'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Enrolled Courses
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                1
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Upcoming Classes
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                0
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Profile Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {student?.student_name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Student ID</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {student?.student_id || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {student?.course || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {student?.email || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled Since</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {student?.created_at 
                ? new Date(student.created_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Current Course */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Current Course
        </h2>
        {student?.course ? (
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {student.course}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active enrollment
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No courses enrolled yet
          </p>
        )}
      </div>
    </div>
  )
}
