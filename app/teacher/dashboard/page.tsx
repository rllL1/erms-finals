import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users } from 'lucide-react'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get teacher details
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  // Get students count (teachers can view students)
  const { count: studentsCount } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {teacher?.teacher_name || 'Teacher'}!
        </h1>
        <p className="text-purple-100 mt-1">
          Employee ID: {teacher?.employee_id || 'N/A'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {studentsCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Courses
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                0
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
              {teacher?.teacher_name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Employee ID</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {teacher?.employee_id || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {teacher?.email || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {teacher?.created_at 
                ? new Date(teacher.created_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
