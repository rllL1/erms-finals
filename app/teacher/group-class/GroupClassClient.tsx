'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Tooltip,
  Fade,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material'
import { Plus, Users, Clock, Code, Trash2, Eye, Archive, RotateCcw, AlertTriangle, GraduationCap, Building2 } from 'lucide-react'
import type { GroupClass } from '@/lib/types'
import NotificationModal, { type ModalSeverity } from '@/app/components/NotificationModal'
import ConfirmationModal from '@/app/components/ConfirmationModal'

interface Teacher {
  id: string
  teacher_name: string
  email: string
}

interface ArchivableGroupClass extends GroupClass {
  archived_at?: string | null
  auto_delete_at?: string | null
}

function getDaysRemaining(autoDeleteAt: string | null | undefined): number | null {
  if (!autoDeleteAt) return null
  const now = new Date()
  const deleteDate = new Date(autoDeleteAt)
  const diff = deleteDate.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}



export default function GroupClassClient({ teacher }: { teacher: Teacher }) {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [activeClasses, setActiveClasses] = useState<ArchivableGroupClass[]>([])
  const [archivedClasses, setArchivedClasses] = useState<ArchivableGroupClass[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  // Delete confirmation
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; classId: string; name: string }>({ open: false, classId: '', name: '' })

  // Archive confirmation
  const [archiveModal, setArchiveModal] = useState<{ open: boolean; classId: string; name: string }>({ open: false, classId: '', name: '' })
  const [archiveRetention, setArchiveRetention] = useState(30)

  // Restore confirmation
  const [restoreModal, setRestoreModal] = useState<{ open: boolean; classId: string; name: string }>({ open: false, classId: '', name: '' })

  // Notification
  const [notification, setNotification] = useState<{ open: boolean; severity: ModalSeverity; message: string }>({ open: false, severity: 'success', message: '' })

  const [formData, setFormData] = useState({
    class_name: '',
    subject: '',
    department: '',
    year_level: '',
    class_start_time: '',
    class_end_time: '',
  })

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/classes?teacherId=${teacher.id}&includeArchived=true`, {
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setActiveClasses(data.activeClasses || [])
        setArchivedClasses(data.archivedClasses || [])
      } else {
        setError(data.error || 'Failed to fetch classes')
      }
    } catch (_err) {
      setError('An error occurred while fetching classes')
    } finally {
      setLoading(false)
    }
  }, [teacher.id])

  useEffect(() => {
    setMounted(true)
    fetchClasses()
  }, [fetchClasses])

  const handleCreateClass = async () => {
    try {
      setError('')
      setSuccess('')

      if (!formData.class_name || !formData.subject || !formData.class_start_time || !formData.class_end_time) {
        setError('All fields are required')
        return
      }

      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacher.id,
          teacher_name: teacher.teacher_name,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Class created successfully!')
        setOpenDialog(false)
        setFormData({
          class_name: '',
          subject: '',
          department: '',
          year_level: '',
          class_start_time: '',
          class_end_time: '',
        })
        fetchClasses()
      } else {
        setError(data.error || 'Failed to create class')
      }
    } catch (_err) {
      setError('An error occurred while creating the class')
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteClick = (classId: string, name: string) => {
    setConfirmModal({ open: true, classId, name })
  }

  const handleDeleteConfirm = async () => {
    const { classId } = confirmModal
    setConfirmModal({ open: false, classId: '', name: '' })

    try {
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotification({ open: true, severity: 'success', message: 'Class deleted successfully!' })
        fetchClasses()
      } else {
        const data = await response.json()
        setNotification({ open: true, severity: 'error', message: data.error || 'Failed to delete class' })
      }
    } catch (_err) {
      setNotification({ open: true, severity: 'error', message: 'An error occurred while deleting the class' })
    }
  }

  // ── Archive ─────────────────────────────────────────────────────────────────
  const handleArchiveClick = (classId: string, name: string) => {
    setArchiveModal({ open: true, classId, name })
  }

  const handleArchiveConfirm = async () => {
    const { classId } = archiveModal
    setArchiveModal({ open: false, classId: '', name: '' })

    try {
      const response = await fetch('/api/teacher/classes/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, retentionDays: archiveRetention }),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ open: true, severity: 'success', message: data.message || 'Class archived successfully!' })
        fetchClasses()
      } else {
        setNotification({ open: true, severity: 'error', message: data.error || 'Failed to archive class' })
      }
    } catch (_err) {
      setNotification({ open: true, severity: 'error', message: 'An error occurred while archiving the class' })
    }
  }

  // ── Restore ─────────────────────────────────────────────────────────────────
  const handleRestoreClick = (classId: string, name: string) => {
    setRestoreModal({ open: true, classId, name })
  }

  const handleRestoreConfirm = async () => {
    const { classId } = restoreModal
    setRestoreModal({ open: false, classId: '', name: '' })

    try {
      const response = await fetch('/api/teacher/classes/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ open: true, severity: 'success', message: data.message || 'Class restored successfully!' })
        fetchClasses()
      } else {
        setNotification({ open: true, severity: 'error', message: data.error || 'Failed to restore class' })
      }
    } catch (_err) {
      setNotification({ open: true, severity: 'error', message: 'An error occurred while restoring the class' })
    }
  }

  if (!mounted) {
    return null
  }

  // ── Active Classes Grid ─────────────────────────────────────────────────────
  const renderActiveClasses = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (activeClasses.length === 0) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: { xs: 4, sm: 8 } }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No classes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first class to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => setOpenDialog(true)}
              sx={{ bgcolor: 'rgb(147, 51, 234)', '&:hover': { bgcolor: 'rgb(126, 34, 206)' } }}
            >
              Create Class
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        },
        gap: { xs: 2, sm: 3 },
      }}>
        {activeClasses.map((cls) => (
          <Card key={cls.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Typography variant="h6" component="h2" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {cls.class_name}
                </Typography>
                <Box sx={{ display: 'flex', flexShrink: 0 }}>
                  <Tooltip title="View Class">
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/teacher/group-class/${cls.id}`)}
                      sx={{ color: 'rgb(147, 51, 234)' }}
                    >
                      <Eye size={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Archive Class">
                    <IconButton
                      size="small"
                      onClick={() => handleArchiveClick(cls.id, cls.class_name)}
                      sx={{ color: '#f59e0b' }}
                    >
                      <Archive size={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Class">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(cls.id, cls.class_name)}
                      sx={{ color: 'error.main' }}
                    >
                      <Trash2 size={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Chip
                label={cls.subject}
                size="small"
                sx={{ mb: 2, bgcolor: 'rgb(147, 51, 234)', color: 'white' }}
              />

              {(cls.department || cls.year_level) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  {cls.department && (
                    <Chip
                      icon={<Building2 size={14} />}
                      label={cls.department}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: 'rgb(147, 51, 234)', color: 'rgb(147, 51, 234)', '& .MuiChip-icon': { color: 'rgb(147, 51, 234)' } }}
                    />
                  )}
                  {cls.year_level && (
                    <Chip
                      icon={<GraduationCap size={14} />}
                      label={cls.year_level}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#2563eb', color: '#2563eb', '& .MuiChip-icon': { color: '#2563eb' } }}
                    />
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Clock size={16} />
                <Typography variant="body2" color="text.secondary">
                  {cls.class_start_time} - {cls.class_end_time}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Users size={16} />
                <Typography variant="body2" color="text.secondary">
                  {cls.student_count || 0} student{cls.student_count !== 1 ? 's' : ''}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Code size={16} />
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {cls.class_code}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    )
  }

  // ── Archived Classes Grid ───────────────────────────────────────────────────
  const renderArchivedClasses = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (archivedClasses.length === 0) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: { xs: 4, sm: 8 } }}>
            <Archive size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No archived classes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Archived classes will appear here. You can restore them before they expire.
            </Typography>
          </CardContent>
        </Card>
      )
    }

    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        },
        gap: { xs: 2, sm: 3 },
      }}>
        {archivedClasses.map((cls) => {
          const daysRemaining = getDaysRemaining(cls.auto_delete_at)
          const isUrgent = daysRemaining !== null && daysRemaining <= 7

          return (
            <Card
              key={cls.id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: isUrgent ? '2px solid #ef4444' : '1px solid',
                borderColor: isUrgent ? '#ef4444' : 'divider',
                opacity: 0.9,
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {/* Archived badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: 12,
                  bgcolor: isUrgent ? '#ef4444' : '#f59e0b',
                  color: 'white',
                  px: 1.5,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  boxShadow: 1,
                }}
              >
                {isUrgent && <AlertTriangle size={12} />}
                {daysRemaining !== null ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left` : 'Archived'}
              </Box>

              <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 3.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: 'text.secondary' }}>
                    {cls.class_name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexShrink: 0 }}>
                    <Tooltip title="View Records (Read-only)">
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/teacher/group-class/${cls.id}`)}
                        sx={{ color: 'rgb(147, 51, 234)' }}
                      >
                        <Eye size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Restore Class">
                      <IconButton
                        size="small"
                        onClick={() => handleRestoreClick(cls.id, cls.class_name)}
                        sx={{ color: '#16a34a' }}
                      >
                        <RotateCcw size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Permanently">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(cls.id, cls.class_name)}
                        sx={{ color: 'error.main' }}
                      >
                        <Trash2 size={20} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Chip
                  label={cls.subject}
                  size="small"
                  sx={{ mb: 2, bgcolor: '#9ca3af', color: 'white' }}
                />

                {(cls.department || cls.year_level) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                    {cls.department && (
                      <Chip
                        icon={<Building2 size={14} />}
                        label={cls.department}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#9ca3af', color: '#6b7280', '& .MuiChip-icon': { color: '#6b7280' } }}
                      />
                    )}
                    {cls.year_level && (
                      <Chip
                        icon={<GraduationCap size={14} />}
                        label={cls.year_level}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#9ca3af', color: '#6b7280', '& .MuiChip-icon': { color: '#6b7280' } }}
                      />
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Clock size={16} />
                  <Typography variant="body2" color="text.secondary">
                    {cls.class_start_time} - {cls.class_end_time}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Users size={16} />
                  <Typography variant="body2" color="text.secondary">
                    {cls.student_count || 0} student{cls.student_count !== 1 ? 's' : ''}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Code size={16} />
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {cls.class_code}
                  </Typography>
                </Box>

                {/* Archive info */}
                <Box sx={{ mt: 2, p: 1.5, bgcolor: isUrgent ? '#fef2f2' : '#fffbeb', borderRadius: 1, border: '1px solid', borderColor: isUrgent ? '#fecaca' : '#fde68a' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Archived: {formatDate(cls.archived_at)}
                  </Typography>
                  <Typography variant="caption" color={isUrgent ? 'error' : 'text.secondary'} fontWeight={isUrgent ? 700 : 400} display="block">
                    Auto-delete: {formatDate(cls.auto_delete_at)}
                  </Typography>
                </Box>

                {/* Restore button */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RotateCcw size={16} />}
                  onClick={() => handleRestoreClick(cls.id, cls.class_name)}
                  fullWidth
                  sx={{
                    mt: 2,
                    color: '#16a34a',
                    borderColor: '#16a34a',
                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                    textTransform: 'none',
                  }}
                >
                  Restore Class
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: '1536px', mx: 'auto', mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 1, sm: 2 } }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 3,
      }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom sx={{ mb: 0 }}>
          Group Classes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setOpenDialog(true)}
          fullWidth={isMobile}
          sx={{ bgcolor: 'rgb(147, 51, 234)', '&:hover': { bgcolor: 'rgb(126, 34, 206)' } }}
        >
          Create Class
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs for Active / Archived */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 },
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Active Classes
              {activeClasses.length > 0 && (
                <Chip label={activeClasses.length} size="small" sx={{ bgcolor: 'rgb(147, 51, 234)', color: 'white', height: 22, fontSize: '0.75rem' }} />
              )}
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Archive size={16} />
              Archived Classes
              {archivedClasses.length > 0 && (
                <Chip label={archivedClasses.length} size="small" sx={{ bgcolor: '#f59e0b', color: 'white', height: 22, fontSize: '0.75rem' }} />
              )}
            </Box>
          }
        />
      </Tabs>

      {activeTab === 0 && renderActiveClasses()}
      {activeTab === 1 && renderArchivedClasses()}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      <ConfirmationModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, classId: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Class"
        message={`Are you sure you want to permanently delete "${confirmModal.name}"? This will remove all students and materials from the class. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* ── Archive Confirmation Modal ─────────────────────────────────────── */}
      <Dialog
        open={archiveModal.open}
        onClose={() => setArchiveModal({ open: false, classId: '', name: '' })}
        maxWidth="xs"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={300}
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
        }}
      >
        <Box sx={{ bgcolor: '#fffbeb', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%',
            bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Archive size={28} color="#f59e0b" />
          </Box>
          <Typography variant="h6" fontWeight={700} textAlign="center">
            Archive Class
          </Typography>
        </Box>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" textAlign="center" sx={{ mb: 2 }}>
            Are you sure you want to archive <strong>&ldquo;{archiveModal.name}&rdquo;</strong>?
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              All student records, quiz records, assignment records, exam records, and grades history will be <strong>preserved</strong> and remain accessible for reference.
            </Typography>
          </Alert>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Retention Period</InputLabel>
            <Select
              value={archiveRetention}
              label="Retention Period"
              onChange={(e) => setArchiveRetention(Number(e.target.value))}
            >
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={45}>45 days</MenuItem>
              <MenuItem value={60}>60 days</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            The class will be auto-deleted after {archiveRetention} days. You can restore it anytime before then.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setArchiveModal({ open: false, classId: '', name: '' })}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleArchiveConfirm}
            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none' }}
            startIcon={<Archive size={18} />}
          >
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Restore Confirmation Modal ─────────────────────────────────────── */}
      <ConfirmationModal
        open={restoreModal.open}
        onClose={() => setRestoreModal({ open: false, classId: '', name: '' })}
        onConfirm={handleRestoreConfirm}
        title="Restore Class"
        message={`Are you sure you want to restore "${restoreModal.name}"? It will be moved back to your active classes.`}
        confirmLabel="Restore"
        variant="info"
      />

      {/* ── Notification Modal ─────────────────────────────────────────────── */}
      <NotificationModal
        open={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
        severity={notification.severity}
        autoCloseMs={2000}
      />

      {/* ── Create Class Dialog ────────────────────────────────────────────── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Create New Class</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Class Name"
              fullWidth
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
            />
            <TextField
              label="Subject"
              fullWidth
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              helperText="Subject must be unique per teacher"
            />
            <TextField
              label="Department / Course"
              fullWidth
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g. BSCS, BSIT, BSED, STEM, ABM"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Building2 size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Year Level"
              fullWidth
              value={formData.year_level}
              onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
              placeholder="e.g. 1st Year, 2nd Year"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <GraduationCap size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Start Time"
              type="time"
              fullWidth
              value={formData.class_start_time}
              onChange={(e) => setFormData({ ...formData, class_start_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Time"
              type="time"
              fullWidth
              value={formData.class_end_time}
              onChange={(e) => setFormData({ ...formData, class_end_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 1 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
          <Button onClick={() => setOpenDialog(false)} fullWidth={isMobile}>Cancel</Button>
          <Button
            onClick={handleCreateClass}
            variant="contained"
            fullWidth={isMobile}
            sx={{ bgcolor: 'rgb(147, 51, 234)', '&:hover': { bgcolor: 'rgb(126, 34, 206)' } }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
