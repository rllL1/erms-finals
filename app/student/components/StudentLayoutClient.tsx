'use client'

import { useState, useEffect } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import StudentSidebar from './StudentSidebar'
import StudentHeader from './StudentHeader'
import MobileBottomNav from '@/app/components/MobileBottomNav'

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(10), // Space for bottom nav
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    paddingBottom: theme.spacing(10), // Space for bottom nav
  },
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}))

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
  minHeight: '64px !important',
  [theme.breakpoints.down('sm')]: {
    minHeight: '56px !important',
  },
}))

interface StudentLayoutClientProps {
  children: React.ReactNode
  email: string
  name: string
}

export default function StudentLayoutClient({ children, email, name }: StudentLayoutClientProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setOpen(!isMobile)
  }, [isMobile])

  const handleDrawerToggle = () => {
    setOpen(!open)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <StudentHeader email={email} name={name} open={open} onMenuClick={handleDrawerToggle} isMobile={isMobile} />
      {/* Hide sidebar on mobile - use bottom nav instead */}
      {!isMobile && <StudentSidebar open={open} onClose={handleDrawerToggle} />}
      <Main open={open}>
        <DrawerHeader />
        <Box sx={{ 
          width: '100%', 
          maxWidth: '100%',
          overflowX: 'auto'
        }}>
          {children}
        </Box>
      </Main>
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="student" />
    </Box>
  )
}
