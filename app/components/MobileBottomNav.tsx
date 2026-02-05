'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Box, Paper, Badge } from '@mui/material'
import { 
  LayoutDashboard, 
  BookOpen, 
  User, 
  ClipboardList, 
  Users, 
  FileText, 
  History, 
  MessageSquare 
} from 'lucide-react'
import { useEffect, useState } from 'react'

type UserRole = 'admin' | 'teacher' | 'student'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  hasBadge?: boolean
}

const studentNavItems: NavItem[] = [
  { name: 'Home', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Class', href: '/student/class', icon: BookOpen },
  { name: 'Grades', href: '/student/grades', icon: ClipboardList },
  { name: 'Profile', href: '/student/profile', icon: User },
]

const teacherNavItems: NavItem[] = [
  { name: 'Home', href: '/teacher/dashboard', icon: LayoutDashboard },
  { name: 'Quiz', href: '/teacher/quiz', icon: FileText },
  { name: 'Class', href: '/teacher/group-class', icon: Users },
  { name: 'Grades', href: '/teacher/grades', icon: ClipboardList },
  { name: 'Chat', href: '/teacher/messages', icon: MessageSquare, hasBadge: true },
]

const adminNavItems: NavItem[] = [
  { name: 'Home', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Chat', href: '/admin/messages', icon: MessageSquare, hasBadge: true },
  { name: 'Records', href: '/admin/records', icon: FileText },
  { name: 'Logs', href: '/admin/audit-logs', icon: History },
]

interface MobileBottomNavProps {
  role: UserRole
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  const navItems = role === 'admin' 
    ? adminNavItems 
    : role === 'teacher' 
      ? teacherNavItems 
      : studentNavItems

  // Fetch unread count for roles that have messaging
  useEffect(() => {
    if (role === 'student') return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/unread-count')
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [role])

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: 'block', md: 'none' },
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        pb: 'env(safe-area-inset-bottom)',
      }}
      elevation={8}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: 56,
          px: 0.5,
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          const showBadge = item.hasBadge && unreadCount > 0

          return (
            <Link
              key={item.name}
              href={item.href}
              style={{ 
                textDecoration: 'none',
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 0.5,
                  px: 1,
                  borderRadius: 2,
                  minWidth: 56,
                  transition: 'all 0.2s ease',
                  color: isActive ? '#16a34a' : 'text.secondary',
                  bgcolor: isActive ? 'rgba(22, 163, 74, 0.1)' : 'transparent',
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              >
                {showBadge ? (
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <Icon size={22} />
                  </Badge>
                ) : (
                  <Icon size={22} />
                )}
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: isActive ? 600 : 400,
                    mt: 0.25,
                    lineHeight: 1,
                  }}
                >
                  {item.name}
                </Box>
              </Box>
            </Link>
          )
        })}
      </Box>
    </Paper>
  )
}
