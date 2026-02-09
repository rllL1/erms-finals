'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Box, Paper, Badge } from '@mui/material'
import { alpha } from '@mui/material/styles'
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
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
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
        borderColor: alpha('#000', 0.06),
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        pb: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
      }}
      elevation={0}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: 60,
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
                  py: 0.75,
                  px: 1.5,
                  borderRadius: 2.5,
                  minWidth: 58,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: isActive ? '#059669' : '#6b7280',
                  bgcolor: isActive ? alpha('#059669', 0.1) : 'transparent',
                  position: 'relative',
                  '&:active': {
                    transform: 'scale(0.92)',
                  },
                  // Active indicator dot
                  '&::after': isActive ? {
                    content: '""',
                    position: 'absolute',
                    bottom: 3,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    bgcolor: '#059669',
                  } : {},
                }}
              >
                {showBadge ? (
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error" 
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        top: -2,
                        right: -4,
                      }
                    }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </Badge>
                ) : (
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                )}
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.625rem',
                    fontWeight: isActive ? 600 : 500,
                    mt: 0.5,
                    lineHeight: 1,
                    letterSpacing: '0.01em',
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
