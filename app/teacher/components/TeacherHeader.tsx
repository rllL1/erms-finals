'use client'

import { logout } from '@/lib/actions/auth'
import { LogOut, User } from 'lucide-react'

interface TeacherHeaderProps {
  email: string
  name: string
}

export default function TeacherHeader({ name }: TeacherHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo for mobile */}
        <div className="lg:hidden font-semibold text-gray-900 dark:text-white">
          Teacher Portal
        </div>

        {/* Spacer for desktop */}
        <div className="hidden lg:block lg:w-64" />

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <User className="w-4 h-4" />
            <span className="max-w-[200px] truncate">{name}</span>
          </div>

          {/* Logout button */}
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
