import { createClient } from '@/lib/supabase/server'
import { BookOpen, Calendar, CheckCircle, Clock, TrendingUp, FileText, GraduationCap, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get student details
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  // Get enrolled classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select(`
      id,
      joined_at,
      group_classes (
        id,
        class_name,
        subject,
        class_start_time,
        class_end_time,
        teacher_name,
        class_code
      )
    `)
    .eq('student_id', student?.id)
    .order('joined_at', { ascending: false })

  const enrolledClasses = enrollments || []

  // Get all submissions for the student
  const { data: submissions } = await supabase
    .from('student_submissions')
    .select(`
      id,
      score,
      max_score,
      is_graded,
      status,
      submitted_at,
      class_materials (
        id,
        title,
        material_type,
        due_date,
        class_id,
        group_classes (
          class_name,
          subject
        )
      )
    `)
    .eq('student_id', student?.id)
    .order('submitted_at', { ascending: false })

  const allSubmissions = submissions || []

  // Get pending materials (not submitted yet)
  const classIds = enrolledClasses.map((e: any) => e.group_classes?.id).filter(Boolean)
  
  let pendingMaterials: any[] = []
  if (classIds.length > 0) {
    const { data: materials } = await supabase
      .from('class_materials')
      .select(`
        id,
        title,
        material_type,
        due_date,
        class_id,
        group_classes (
          class_name,
          subject
        )
      `)
      .in('class_id', classIds)
      .order('due_date', { ascending: true })

    const submittedMaterialIds = allSubmissions.map((s: any) => s.class_materials?.id).filter(Boolean)
    pendingMaterials = (materials || []).filter((m: any) => !submittedMaterialIds.includes(m.id))
  }

  // Calculate stats
  const totalClasses = enrolledClasses.length
  const completedSubmissions = allSubmissions.filter((s: any) => s.status === 'submitted' || s.status === 'graded')
  const gradedSubmissions = allSubmissions.filter((s: any) => s.is_graded && s.score !== null && s.max_score)
  
  const averageGrade = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum: number, s: any) => sum + ((s.score / s.max_score) * 100), 0) / gradedSubmissions.length
    : 0

  const pendingCount = pendingMaterials.filter((m: any) => {
    const dueDate = m.due_date ? new Date(m.due_date) : null
    return !dueDate || dueDate > new Date()
  }).length

  // Get upcoming due items (next 7 days)
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingDue = pendingMaterials.filter((m: any) => {
    if (!m.due_date) return false
    const dueDate = new Date(m.due_date)
    return dueDate >= now && dueDate <= nextWeek
  }).slice(0, 5)

  // Recent activity (last 5 submissions)
  const recentActivity = allSubmissions.slice(0, 5)

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Enrolled Classes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totalClasses}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Tasks
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {pendingCount}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {completedSubmissions.length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Grade
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {averageGrade > 0 ? `${averageGrade.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Due */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Upcoming Due
            </h2>
            <Link href="/student/class" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400">
              View All
            </Link>
          </div>
          
          {upcomingDue.length > 0 ? (
            <div className="space-y-3">
              {upcomingDue.map((item: any) => {
                const dueDate = new Date(item.due_date)
                const isUrgent = dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000
                
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className={`p-2 rounded-lg ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      {item.material_type === 'quiz' ? (
                        <FileText className={`w-4 h-4 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                      ) : (
                        <GraduationCap className={`w-4 h-4 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.group_classes?.subject} • {item.material_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-10 h-10 mb-2 text-green-500" />
              <p className="text-sm">No upcoming deadlines!</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Recent Activity
            </h2>
            <Link href="/student/grades" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400">
              View Grades
            </Link>
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    activity.is_graded 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    {activity.is_graded ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {activity.class_materials?.title || 'Submission'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.class_materials?.group_classes?.subject} • {activity.class_materials?.material_type}
                    </p>
                  </div>
                  <div className="text-right">
                    {activity.is_graded ? (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {activity.score}/{activity.max_score}
                      </p>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-10 h-10 mb-2" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-green-500" />
            My Classes
          </h2>
          <Link href="/student/class" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400">
            View All Classes
          </Link>
        </div>
        
        {enrolledClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledClasses.slice(0, 6).map((enrollment: any) => {
              const classData = enrollment.group_classes
              if (!classData) return null
              
              return (
                <Link
                  key={enrollment.id}
                  href={`/student/class/${classData.id}`}
                  className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {classData.subject}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {classData.class_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {classData.teacher_name}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-10 h-10 mb-2" />
            <p className="text-sm">No classes enrolled yet</p>
            <Link 
              href="/student/class" 
              className="mt-2 text-sm text-green-600 hover:text-green-700 dark:text-green-400"
            >
              Join a class
            </Link>
          </div>
        )}
      </div>

      {/* Profile Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile Information
          </h2>
          <Link href="/student/profile" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400">
            Edit Profile
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled Since</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {student?.created_at 
                ? new Date(student.created_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
