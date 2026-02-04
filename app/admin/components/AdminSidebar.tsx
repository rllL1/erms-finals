'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles'
import MuiDrawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Box from '@mui/material/Box'
import { LayoutDashboard, Users } from 'lucide-react'

const drawerWidth = 240
const miniDrawerWidth = 70

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: miniDrawerWidth,
})

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}))

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
)

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
]

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const theme = useTheme()
  const pathname = usePathname()

  return (
    <Drawer 
      variant="permanent" 
      open={open}
      sx={{
        '& .MuiDrawer-paper': {
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DrawerHeader sx={{ py: 2, justifyContent: open ? 'space-between' : 'center', alignItems: 'center', minHeight: '64px' }}>
        {open && (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Image
              src="/sdsc-logo.png"
              alt="SDSC Logo"
              width={120}
              height={120}
              style={{ objectFit: 'contain' }}
            />
          </Box>
        )}
        <IconButton onClick={onClose} size="small">
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <List sx={{ px: open ? 1.5 : 0.5, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.5, display: 'block' }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  '&.Mui-selected': {
                    bgcolor: '#16a34a',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: '#15803d',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#fff',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(22, 163, 74, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? '#fff' : '#16a34a', 
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                }}>
                  <Icon className="w-5 h-5" />
                </ListItemIcon>
                <ListItemText 
                  primary={item.name} 
                  sx={{ opacity: open ? 1 : 0 }}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Drawer>
  )
}
