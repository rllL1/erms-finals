'use client'

import { logout } from '@/lib/actions/auth'
import { LogOut, User, ChevronDown, Bell, FileText, Shield, AlertCircle, CheckCircle, XCircle, Settings } from 'lucide-react'
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
import { styled, alpha } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const drawerWidth = 260
const miniDrawerWidth = 78

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.easeInOut,
    duration: 280,
  }),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  color: '#1f2937',
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  [theme.breakpoints.up('md')]: {
    width: `calc(100% - ${miniDrawerWidth}px)`,
    marginLeft: `${miniDrawerWidth}px`,
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeInOut,
        duration: 280,
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
      <Toolbar sx={{ minHeight: { xs: '60px', sm: '68px' } }}>
        {/* Hide menu button on mobile since we use bottom nav */}
        {!isMobileLayout && (
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={onMenuClick}
            edge="start"
            sx={{ 
              mr: 2,
              bgcolor: alpha('#059669', 0.08),
              color: '#059669',
              '&:hover': {
                bgcolor: alpha('#059669', 0.15),
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <div style={{ flexGrow: 1 }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Notification Bell */}
          <IconButton
            color="inherit"
            onClick={handleNotifClick}
            sx={{
              position: 'relative',
              bgcolor: notifOpen ? alpha('#059669', 0.1) : 'transparent',
              '&:hover': {
                bgcolor: alpha('#059669', 0.08),
              },
            }}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  minWidth: 18,
                  height: 18,
                }
              }}
            >
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
                width: 400,
                maxWidth: '95vw',
                maxHeight: 520,
                mt: 1.5,
                overflow: 'hidden',
                borderRadius: 3,
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                border: '1px solid',
                borderColor: alpha('#000', 0.06),
              },
            }}
          >
            <Box sx={{ 
              p: 2.5, 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '1px solid',
              borderColor: alpha('#000', 0.06),
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    Notifications
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {unreadCount} new notifications
                  </Typography>
                </Box>
                {unreadCount > 0 && (
                  <Chip 
                    label={`${unreadCount} new`} 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha('#059669', 0.1),
                      color: '#059669',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }} 
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ maxHeight: 380, overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 5, textAlign: 'center' }}>
                  <Box sx={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 3,
                    bgcolor: alpha('#059669', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}>
                    <Bell className="w-8 h-8 text-emerald-500" />
                  </Box>
                  <Typography color="text.secondary" variant="body2" fontWeight={500}>
                    All caught up!
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    No new notifications
                  </Typography>
                </Box>
              ) : (
                notifications.map((notif, index) => (
                  <Box
                    key={notif.id}
                    sx={{
                      p: 2,
                      borderBottom: index < notifications.length - 1 ? '1px solid' : 'none',
                      borderColor: alpha('#000', 0.04),
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha('#059669', 0.04),
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'start' }}>
                      <Box sx={{ 
                        mt: 0.25,
                        p: 1,
                        borderRadius: 2,
                        bgcolor: notif.status === 'success' ? alpha('#10b981', 0.1) :
                                 notif.status === 'failure' ? alpha('#ef4444', 0.1) :
                                 notif.status === 'warning' ? alpha('#f59e0b', 0.1) :
                                 alpha('#3b82f6', 0.1),
                      }}>
                        {getNotificationIcon(notif)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, mb: 0.25, color: '#1f2937' }}
                        >
                          {notif.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.75, lineHeight: 1.4 }}
                        >
                          {notif.description}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.7rem' }}>
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
                          sx={{ 
                            fontSize: '0.65rem', 
                            height: 22,
                            fontWeight: 600,
                            bgcolor: notif.exam_type === 'exam' ? alpha('#10b981', 0.1) :
                                     notif.exam_type === 'quiz' ? alpha('#6366f1', 0.1) :
                                     alpha('#f59e0b', 0.1),
                            color: notif.exam_type === 'exam' ? '#059669' :
                                   notif.exam_type === 'quiz' ? '#4f46e5' :
                                   '#d97706',
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
              <Link
                href="/admin/audit-logs"
                style={{
                  fontSize: '0.875rem',
                  color: '#059669',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
                onClick={handleNotifClose}
              >
                View All Notifications
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </Link>
            </Box>
          </Popover>

          {/* User Menu */}
          <Box
            onClick={handleClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              py: 1,
              px: isMobile ? 1 : 2,
              borderRadius: 2.5,
              ml: 0.5,
              transition: 'all 0.2s',
              bgcolor: menuOpen ? alpha('#059669', 0.08) : 'transparent',
              border: '1px solid',
              borderColor: menuOpen ? alpha('#059669', 0.2) : 'transparent',
              '&:hover': {
                bgcolor: alpha('#059669', 0.08),
                borderColor: alpha('#059669', 0.15),
              },
            }}
          >
            <Avatar 
              sx={{ 
                width: { xs: 34, sm: 38 }, 
                height: { xs: 34, sm: 38 }, 
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                fontSize: '0.9rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
              }}
            >
              {email.charAt(0).toUpperCase()}
            </Avatar>
            {!isMobile && (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937', lineHeight: 1.2 }}>
                    {email.split('@')[0]}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem' }}>
                    Administrator
                  </Typography>
                </Box>
                <ChevronDown 
                  className="w-4 h-4" 
                  style={{ 
                    color: '#9ca3af',
                    transition: 'transform 0.2s',
                    transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }} 
                />
              </>
            )}
          </Box>

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
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha('#000', 0.06),
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                mt: 1.5,
                minWidth: 220,
                '& .MuiMenuItem-root': {
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 2,
                  mx: 1,
                  my: 0.25,
                  transition: 'all 0.15s',
                },
              },
            }}
          >
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: alpha('#000', 0.06) }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Signed in as
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                {email}
              </Typography>
            </Box>
            <Box sx={{ py: 1 }}>
              <MenuItem 
                component={Link} 
                href="/admin/profile" 
                sx={{ 
                  gap: 1.5,
                  '&:hover': {
                    bgcolor: alpha('#059669', 0.08),
                    color: '#059669',
                  }
                }}
              >
                <User className="w-4 h-4" />
                Profile
              </MenuItem>
              <MenuItem 
                sx={{ 
                  gap: 1.5,
                  '&:hover': {
                    bgcolor: alpha('#059669', 0.08),
                    color: '#059669',
                  }
                }}
              >
                <Settings className="w-4 h-4" />
                Settings
              </MenuItem>
            </Box>
            <Divider sx={{ mx: 1 }} />
            <Box sx={{ py: 1 }}>
              <MenuItem 
                onClick={() => {
                  handleClose()
                  logout()
                }}
                sx={{ 
                  gap: 1.5, 
                  color: '#ef4444',
                  '&:hover': {
                    bgcolor: alpha('#ef4444', 0.08),
                  }
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </MenuItem>
            </Box>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  )
}
