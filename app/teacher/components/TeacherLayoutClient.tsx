'use client'

import { useState, useSyncExternalStore, useCallback } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import TeacherSidebar from './TeacherSidebar'
import TeacherHeader from './TeacherHeader'
import FloatingChatButton from '@/app/components/FloatingChatButton'
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
}))

interface TeacherLayoutClientProps {
  children: React.ReactNode
  email: string
  name: string
}

export default function TeacherLayoutClient({ children, email, name }: TeacherLayoutClientProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const [open, setOpen] = useState(!isMobile)

  // Use useSyncExternalStore to safely track hydration
  const mounted = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  )

  const handleDrawerToggle = () => {
    setOpen(!open)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <TeacherHeader email={email} name={name} open={open} onMenuClick={handleDrawerToggle} isMobile={isMobile} />
      {/* Hide sidebar on mobile - use bottom nav instead */}
      {!isMobile && <TeacherSidebar open={open} onClose={handleDrawerToggle} />}
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
      {/* Hide floating chat on mobile since we have bottom nav */}
      {!isMobile && <FloatingChatButton role="teacher" />}
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="teacher" />
    </Box>
  )
}
