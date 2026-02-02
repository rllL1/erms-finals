'use client'

import { logout } from '@/lib/actions/auth'
import { LogOut, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminHeaderProps {
  email: string
}

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Users', href: '/admin/users' },
]

export default function AdminHeader({ email }: AdminHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo for mobile */}
        <div className="lg:hidden font-semibold text-gray-900 dark:text-white">
          Admin Panel
        </div>

        {/* Spacer for desktop */}
        <div className="hidden lg:block lg:w-64" />

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <User className="w-4 h-4" />
            <span className="max-w-[200px] truncate">{email}</span>
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

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
