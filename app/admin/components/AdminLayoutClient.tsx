'use client'

import { useState } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

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

interface AdminLayoutClientProps {
  children: React.ReactNode
  email: string
}

export default function AdminLayoutClient({ children, email }: AdminLayoutClientProps) {
  const [open, setOpen] = useState(true)

  const handleDrawerToggle = () => {
    setOpen(!open)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminHeader email={email} open={open} onMenuClick={handleDrawerToggle} />
      <AdminSidebar open={open} onClose={handleDrawerToggle} />
      <Main open={open}>
        <DrawerHeader />
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
          {children}
        </Box>
      </Main>
    </Box>
  )
}
