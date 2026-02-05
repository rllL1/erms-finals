'use client'

import { logout } from '@/lib/actions/auth'
import { LogOut, User, ChevronDown, Bell, FileText, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import Toolbar from '@mui/material/Toolbar'
import MuiAppBar from '@mui/material/AppBar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Popover from '@mui/material/Popover'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import { styled } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const drawerWidth = 240
const miniDrawerWidth = 70

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: '#fff',
  color: '#1f2937',
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  [theme.breakpoints.up('md')]: {
    width: `calc(100% - ${miniDrawerWidth}px)`,
    marginLeft: `${miniDrawerWidth}px`,
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    marginLeft: 0,
  },
}))

interface AdminHeaderProps {
  email: string
  open: boolean
  onMenuClick: () => void
  isMobile?: boolean
}

interface Notification {
  id: string
  type: 'audit' | 'exam'
  title: string
  description: string
  status?: string
  action_type?: string
  exam_type?: string
  created_at: string
}

export default function AdminHeader({ email, open, onMenuClick, isMobile: isMobileLayout }: AdminHeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const menuOpen = Boolean(anchorEl)
  const notifOpen = Boolean(notifAnchorEl)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget)
  }

  const handleNotifClose = () => {
    setNotifAnchorEl(null)
  }

  const getNotificationIcon = (notification: Notification) => {
    if (notification.type === 'audit') {
      switch (notification.status) {
        case 'success':
          return <CheckCircle className="w-4 h-4 text-green-600" />
        case 'failure':
          return <XCircle className="w-4 h-4 text-red-600" />
        case 'warning':
          return <AlertCircle className="w-4 h-4 text-orange-600" />
        default:
          return <Shield className="w-4 h-4 text-blue-600" />
      }
    } else {
      return <FileText className="w-4 h-4 text-green-600" />
    }
  }

  return (
    <AppBar position="fixed" open={open}>
      <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }}>
        {/* Hide menu button on mobile since we use bottom nav */}
        {!isMobileLayout && (
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={onMenuClick}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <div style={{ flexGrow: 1 }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Notification Bell */}
          <IconButton
            color="inherit"
            onClick={handleNotifClick}
            sx={{
              position: 'relative',
              '&:hover': {
                bgcolor: '#f3f4f6',
              },
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Bell className="w-5 h-5" />
            </Badge>
          </IconButton>

          {/* Notifications Popover */}
          <Popover
            open={notifOpen}
            anchorEl={notifAnchorEl}
            onClose={handleNotifClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                width: 380,
                maxWidth: '100vw',
                maxHeight: 500,
                mt: 1.5,
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              },
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {unreadCount} new notifications
              </Typography>
            </Box>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <Typography color="text.secondary" variant="body2">
                    No notifications
                  </Typography>
                </Box>
              ) : (
                notifications.map((notif) => (
                  <Box
                    key={notif.id}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#f9fafb',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'start' }}>
                      <Box sx={{ mt: 0.5 }}>{getNotificationIcon(notif)}</Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 0.5 }}
                        >
                          {notif.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          {notif.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {mounted
                            ? formatDistanceToNow(new Date(notif.created_at), {
                                addSuffix: true,
                              })
                            : new Date(notif.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {notif.type === 'exam' && (
                        <Chip
                          label={notif.exam_type}
                          size="small"
                          color={
                            notif.exam_type === 'exam'
                              ? 'success'
                              : notif.exam_type === 'quiz'
                              ? 'primary'
                              : 'warning'
                          }
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
            <Divider />
            <Box sx={{ p: 1.5, textAlign: 'center' }}>
              <Link
                href="/admin/audit-logs"
                style={{
                  fontSize: '0.875rem',
                  color: '#16a34a',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
                onClick={handleNotifClose}
              >
                View All Notifications
              </Link>
            </Box>
          </Popover>

          {/* User Menu */}
          <div 
            onClick={handleClick}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              cursor: 'pointer',
              padding: isMobile ? '0.5rem' : '0.5rem 1rem',
              borderRadius: '0.5rem',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Avatar sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, bgcolor: '#16a34a', fontSize: '0.875rem' }}>
              {email.charAt(0).toUpperCase()}
            </Avatar>
            {!isMobile && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{email}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Admin</span>
                </div>
                <ChevronDown className="w-4 h-4" style={{ color: '#6b7280' }} />
              </>
            )}
          </div>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                minWidth: 200,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1.5,
                },
              },
            }}
          >
            <MenuItem component={Link} href="/admin/profile" sx={{ gap: 1.5 }}>
              <User className="w-4 h-4" />
              Profile
            </MenuItem>
            <MenuItem 
              onClick={() => {
                handleClose()
                logout()
              }}
              sx={{ gap: 1.5, color: '#ef4444' }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </MenuItem>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  )
}
