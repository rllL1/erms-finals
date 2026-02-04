'use client'

import { useState } from 'react'
import { toggleUserStatus, deleteUser } from '@/lib/actions/admin'
import { MoreVertical, Power, Trash2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

interface Teacher {
  id: string
  user_id: string
  employee_id: string
  teacher_name: string
  email: string
  created_at: string
  profiles?: {
    is_active: boolean
  }
}

interface TeachersTableProps {
  teachers: Teacher[]
}

export default function TeachersTable({ teachers }: TeachersTableProps) {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [searchTerm, setSearchTerm] = useState('')
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setIsLoading(userId)
    try {
      await toggleUserStatus(userId, !currentStatus)
      router.refresh()
    } catch (error) {
      console.error('Error toggling status:', error)
    } finally {
      setIsLoading(null)
      setActionMenu(null)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      return
    }
    setIsLoading(userId)
    try {
      await deleteUser(userId)
      router.refresh()
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setIsLoading(null)
      setActionMenu(null)
    }
  }

  if (teachers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No teachers found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Add a teacher to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Table/Cards */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-4">
          {filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{teacher.teacher_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{teacher.email}</p>
                </div>
                <button
                  onClick={() => setActionMenu(actionMenu === teacher.id ? null : teacher.id)}
                  disabled={isLoading === teacher.user_id}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Employee ID:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{teacher.employee_id}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        teacher.profiles?.is_active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      }`}
                    >
                      {teacher.profiles?.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              {actionMenu === teacher.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <button
                    onClick={() => handleToggleStatus(teacher.user_id, teacher.profiles?.is_active || false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  >
                    <Power className="w-4 h-4" />
                    {teacher.profiles?.is_active ? 'Disable Account' : 'Enable Account'}
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.user_id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Employee ID
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTeachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  {teacher.employee_id}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                  {teacher.teacher_name}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                  {teacher.email}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      teacher.profiles?.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}
                  >
                    {teacher.profiles?.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right relative">
                  <button
                    onClick={() => setActionMenu(actionMenu === teacher.id ? null : teacher.id)}
                    disabled={isLoading === teacher.user_id}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {actionMenu === teacher.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <button
                        onClick={() => handleToggleStatus(teacher.user_id, teacher.profiles?.is_active || false)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Power className="w-4 h-4" />
                        {teacher.profiles?.is_active ? 'Disable Account' : 'Enable Account'}
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.user_id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>      )}
      {filteredTeachers.length === 0 && searchTerm && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No teachers match your search
        </p>
      )}
    </div>
  )
}
