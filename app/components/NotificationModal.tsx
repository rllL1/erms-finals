'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Fade,
} from '@mui/material'
import { CheckCircle, XCircle, AlertTriangle, Info, Copy } from 'lucide-react'

export type ModalSeverity = 'success' | 'error' | 'warning' | 'info' | 'duplicate'

interface NotificationModalProps {
  open: boolean
  onClose: () => void
  title?: string
  message: string
  severity: ModalSeverity
  autoCloseMs?: number
  actionLabel?: string
  onAction?: () => void
}

const severityConfig: Record<ModalSeverity, { icon: React.ElementType; color: string; bgColor: string; defaultTitle: string }> = {
  success: {
    icon: CheckCircle,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    defaultTitle: 'Success',
  },
  error: {
    icon: XCircle,
    color: '#dc2626',
    bgColor: '#fef2f2',
    defaultTitle: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    defaultTitle: 'Warning',
  },
  info: {
    icon: Info,
    color: '#2563eb',
    bgColor: '#eff6ff',
    defaultTitle: 'Information',
  },
  duplicate: {
    icon: Copy,
    color: '#dc2626',
    bgColor: '#fef2f2',
    defaultTitle: 'Duplicate Detected',
  },
}

export default function NotificationModal({
  open,
  onClose,
  title,
  message,
  severity,
  autoCloseMs,
  actionLabel,
  onAction,
}: NotificationModalProps) {
  const config = severityConfig[severity]
  const IconComponent = config.icon

  useEffect(() => {
    if (open && autoCloseMs && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseMs)
      return () => clearTimeout(timer)
    }
  }, [open, autoCloseMs, onClose])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 6,
          bgcolor: config.color,
        }}
      />
      <DialogContent
        sx={{
          textAlign: 'center',
          pt: 4,
          pb: 2,
          px: 4,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: config.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
            animation: 'modalIconPop 0.4s ease-out',
            '@keyframes modalIconPop': {
              '0%': { transform: 'scale(0)', opacity: 0 },
              '60%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        >
          <IconComponent size={40} color={config.color} />
        </Box>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 600, color: '#1e293b' }}
        >
          {title || config.defaultTitle}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: '#64748b', lineHeight: 1.6 }}
        >
          {message}
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'center',
          pb: 3,
          px: 4,
          gap: 1,
        }}
      >
        <Button
          variant="contained"
          onClick={onAction || onClose}
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: config.color,
            '&:hover': {
              bgcolor: config.color,
              filter: 'brightness(0.9)',
            },
          }}
        >
          {actionLabel || 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
