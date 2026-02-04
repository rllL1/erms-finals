'use client'

import { logout } from '@/lib/actions/auth'
import { LogOut, User, ChevronDown, Bell, BookOpen, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import Toolbar from '@mui/material/Toolbar'
import MuiAppBar from '@mui/material/AppBar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { styled } from '@mui/material/styles'
import Link from 'next/link'

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
}))

interface StudentHeaderProps {
  email: string
  name: string
  open: boolean
  onMenuClick: () => void
}

export default function StudentHeader({ name, open, onMenuClick }: StudentHeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const menuOpen = Boolean(anchorEl)
  const notifOpen = Boolean(notifAnchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget)
    if (materials.length === 0) {
      fetchMaterials()
    }
  }

  const handleNotifClose = () => {
    setNotifAnchorEl(null)
  }

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/materials')
      const data = await response.json()
      
      if (response.ok) {
        // Filter only pending materials (not submitted)
        const pending = data.materials?.filter((m: any) => !m.is_submitted) || []
        setMaterials(pending)
      }
    } catch (err) {
      console.error('Error fetching materials:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
    // Refresh every 5 minutes
    const interval = setInterval(fetchMaterials, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AppBar position="fixed" open={open}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <div style={{ flexGrow: 1 }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Notification Icon */}
          <IconButton
            color="inherit"
            onClick={handleNotifClick}
            sx={{ 
              color: '#16a34a',
              '&:hover': { bgcolor: 'rgba(22, 163, 74, 0.08)' }
            }}
          >
            <Badge badgeContent={materials.length} color="error">
              <Bell size={20} />
            </Badge>
          </IconButton>

          <div 
            onClick={handleClick}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#16a34a', fontSize: '0.875rem' }}>
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{name}</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Student</span>
            </div>
            <ChevronDown className="w-4 h-4" style={{ color: '#6b7280' }} />
          </div>

          {/* User Menu */}
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
            <MenuItem component={Link} href="/student/profile" sx={{ gap: 1.5 }}>
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

          {/* Notifications Menu */}
          <Menu
            anchorEl={notifAnchorEl}
            open={notifOpen}
            onClose={handleNotifClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                minWidth: 350,
                maxHeight: 500,
              },
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Pending Materials
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {materials.length} {materials.length === 1 ? 'item' : 'items'} awaiting completion
              </Typography>
            </div>
            
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Typography color="text.secondary">Loading...</Typography>
              </div>
            ) : materials.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Typography color="text.secondary">No pending materials</Typography>
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {materials.map((material, index) => (
                  <div key={material.id}>
                    <MenuItem
                      component={Link}
                      href={`/student/class/${material.class_id}/${material.material_type}/${material.quiz_id}`}
                      onClick={handleNotifClose}
                      sx={{ 
                        py: 2, 
                        px: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 1,
                        '&:hover': { bgcolor: 'rgba(22, 163, 74, 0.04)' }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        {material.material_type === 'quiz' ? (
                          <BookOpen size={18} style={{ color: '#16a34a' }} />
                        ) : (
                          <FileText size={18} style={{ color: '#16a34a' }} />
                        )}
                        <Typography 
                          variant="body2" 
                          fontWeight={500}
                          sx={{ flex: 1 }}
                        >
                          {material.title}
                        </Typography>
                        <Chip
                          label={material.material_type}
                          size="small"
                          sx={{
                            bgcolor: material.material_type === 'quiz' ? '#dcfce7' : '#dbeafe',
                            color: material.material_type === 'quiz' ? '#16a34a' : '#2563eb',
                            fontWeight: 500,
                            fontSize: '0.7rem'
                          }}
                        />
                      </div>
                      <Typography variant="caption" color="text.secondary">
                        {material.group_classes?.class_name || 'Unknown Class'}
                      </Typography>
                      {material.due_date && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: new Date(material.due_date) < new Date() ? '#ef4444' : '#f59e0b',
                            fontWeight: 500
                          }}
                        >
                          Due: {new Date(material.due_date).toLocaleString()}
                        </Typography>
                      )}
                    </MenuItem>
                    {index < materials.length - 1 && <Divider />}
                  </div>
                ))}
              </div>
            )}
            
            {materials.length > 0 && (
              <>
                <Divider />
                <MenuItem
                  component={Link}
                  href="/student/class"
                  onClick={handleNotifClose}
                  sx={{ 
                    justifyContent: 'center',
                    py: 1.5,
                    color: '#16a34a',
                    fontWeight: 500
                  }}
                >
                  View All Classes
                </MenuItem>
              </>
            )}
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  )
}
