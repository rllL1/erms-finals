'use client'

import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Fade,
} from '@mui/material'
import { AlertTriangle, Trash2, Info } from 'lucide-react'

export type ConfirmVariant = 'danger' | 'warning' | 'info'

interface ConfirmationModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  loading?: boolean
}

const variantConfig: Record<ConfirmVariant, { icon: React.ElementType; color: string; bgColor: string; defaultTitle: string }> = {
  danger: {
    icon: Trash2,
    color: '#dc2626',
    bgColor: '#fef2f2',
    defaultTitle: 'Confirm Delete',
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    defaultTitle: 'Are you sure?',
  },
  info: {
    icon: Info,
    color: '#2563eb',
    bgColor: '#eff6ff',
    defaultTitle: 'Confirm Action',
  },
}

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading = false,
}: ConfirmationModalProps) {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
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
          gap: 1.5,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            minWidth: 100,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            color: '#64748b',
            borderColor: '#e2e8f0',
            '&:hover': {
              borderColor: '#cbd5e1',
              bgcolor: '#f8fafc',
            },
          }}
        >
          {cancelLabel || 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
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
          {loading ? 'Processing...' : (confirmLabel || 'Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
