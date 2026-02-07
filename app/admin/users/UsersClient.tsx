'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, GraduationCap, Briefcase, AlertCircle } from 'lucide-react'
import StudentsTable from './StudentsTable'
import TeachersTable from './TeachersTable'

interface Student {
  id: string
  user_id: string
  student_id: string
  student_name: string
  course: string
  email: string
  created_at: string
  profiles?: {
    is_active: boolean
  }
}

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

interface UsersClientProps {
  initialStudents: Student[]
  initialTeachers: Teacher[]
  studentsError?: string
  teachersError?: string
}

export default function UsersClient({
  initialStudents,
  initialTeachers,
  studentsError,
  teachersError,
}: UsersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'teachers' ? 'teachers' : 'students'
  
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>(initialTab)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as EventListener)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as EventListener)
    }
  }, [])

  const handleAddUser = (type: 'student' | 'teacher') => {
    setIsDropdownOpen(false)
    if (type === 'student') {
      router.push('/admin/users/add-student')
    } else {
      router.push('/admin/users/add-teacher')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage students and teachers
          </p>
        </div>

        {/* Add User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={() => handleAddUser('student')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
              >
                <GraduationCap className="w-4 h-4" />
                Add Student
              </button>
              <button
                onClick={() => handleAddUser('teacher')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg"
              >
                <Briefcase className="w-4 h-4" />
                Add Teacher
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'students'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Students ({initialStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'teachers'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Teachers ({initialTeachers.length})
            </button>
          </div>
        </div>

        {/* Error Messages */}
        {(studentsError || teachersError) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">
                {activeTab === 'students' ? studentsError : teachersError}
              </span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'students' ? (
            <StudentsTable students={initialStudents} />
          ) : (
            <TeachersTable teachers={initialTeachers} />
          )}
        </div>
      </div>
    </div>
  )
}
