'use client'

import { useState } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import StudentSidebar from './StudentSidebar'
import StudentHeader from './StudentHeader'

const drawerWidth = 240

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
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
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

interface StudentLayoutClientProps {
  children: React.ReactNode
  email: string
  name: string
}

export default function StudentLayoutClient({ children, email, name }: StudentLayoutClientProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(!isMobile)

  const handleDrawerToggle = () => {
    setOpen(!open)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <StudentHeader email={email} name={name} open={open} onMenuClick={handleDrawerToggle} />
      <StudentSidebar open={open} onClose={handleDrawerToggle} />
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
    </Box>
  )
}
