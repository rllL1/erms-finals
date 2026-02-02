import { getDashboardStats } from '@/lib/actions/admin'
import { Users, GraduationCap, Briefcase } from 'lucide-react'

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'bg-green-500',
      lightBg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: Briefcase,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome to the Admin Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.lightBg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/admin/users"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Manage Users</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add or manage students and teachers
              </p>
            </div>
          </a>
          <a
            href="/admin/users?tab=students"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">View Students</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                See all enrolled students
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
