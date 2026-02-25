'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Card,
  IconButton,
} from '@mui/material'
import { ArrowLeft, Save, Upload, FileText, X, File } from 'lucide-react'
import NotificationModal, { type ModalSeverity } from '../../components/NotificationModal'

interface Assignment {
  id: string
  title: string
  description?: string
  start_date: string | null
  end_date: string | null
  due_date?: string | null
  attachment_url?: string | null
  attachment_name?: string | null
}

interface EditAssignmentClientProps {
  assignment: Assignment
}

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function EditAssignmentClient({ assignment: initialAssignment }: EditAssignmentClientProps) {
  const router = useRouter()
  const [assignment, setAssignment] = useState(initialAssignment)
  const [saving, setSaving] = useState(false)

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    url: string
    storagePath: string
  } | null>(
    initialAssignment.attachment_url && initialAssignment.attachment_name
      ? { name: initialAssignment.attachment_name, url: initialAssignment.attachment_url, storagePath: '' }
      : null
  )
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState('')

  // Notification modal state
  const [modal, setModal] = useState<{
    open: boolean
    title?: string
    message: string
    severity: ModalSeverity
    autoCloseMs?: number
    actionLabel?: string
    onAction?: () => void
  }>({ open: false, message: '', severity: 'info' })

  const showModal = useCallback((severity: ModalSeverity, message: string, opts?: { title?: string; autoCloseMs?: number; actionLabel?: string; onAction?: () => void }) => {
    setModal({ open: true, message, severity, ...opts })
  }, [])

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, open: false }))
  }, [])

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return '📄'
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝'
    return '📎'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ''
    setFileError('')

    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
    if (!hasValidExtension) {
      setFileError('Invalid file type. Only PDF (.pdf) and Word documents (.doc, .docx) are allowed.')
      return
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError('Invalid file type. Only PDF and Word documents are allowed.')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setFileError('File too large. Maximum size is 20MB.')
      return
    }

    if (uploadedFile && uploadedFile.storagePath) {
      await handleRemoveFile(false)
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/teacher/upload-assignment-file', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadedFile({
          name: data.fileName,
          url: data.fileUrl,
          storagePath: data.storagePath,
        })
      } else {
        setFileError(data.error || 'Failed to upload file.')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setFileError('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = async (showFeedback = true) => {
    if (!uploadedFile) return

    if (uploadedFile.storagePath) {
      try {
        await fetch(`/api/teacher/upload-assignment-file?storagePath=${encodeURIComponent(uploadedFile.storagePath)}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Error removing file:', error)
      }
    }

    setUploadedFile(null)
    if (showFeedback) {
      setFileError('')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/teacher/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assignment.title,
          description: assignment.description,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          due_date: assignment.due_date,
          attachment_url: uploadedFile?.url || null,
          attachment_name: uploadedFile?.name || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to update assignment')

      showModal('success', 'Assignment updated successfully!', {
        title: 'Assignment Updated!',
        actionLabel: 'Go to Quizzes',
        onAction: () => {
          closeModal()
          router.push('/teacher/quiz')
        },
        autoCloseMs: 3000,
      })
    } catch (_error) {
      showModal('error', 'Failed to save assignment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatDateForInput = (date: string | null) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16)
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => router.push('/teacher/quiz')}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Save />}
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Assignment'}
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Edit Assignment
        </Typography>

        <TextField
          fullWidth
          label="Assignment Title"
          value={assignment.title}
          onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Add Questions Assignment"
          multiline
          rows={6}
          value={assignment.description || ''}
          onChange={(e) => setAssignment({ ...assignment, description: e.target.value })}
          margin="normal"
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mt: 2 }}>
          <TextField
            label="Start Date"
            type="datetime-local"
            value={formatDateForInput(assignment.start_date)}
            onChange={(e) => setAssignment({ ...assignment, start_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="datetime-local"
            value={formatDateForInput(assignment.end_date)}
            onChange={(e) => setAssignment({ ...assignment, end_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Due Date"
            type="datetime-local"
            value={formatDateForInput(assignment.due_date ?? null)}
            onChange={(e) => setAssignment({ ...assignment, due_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Box>

        {/* File Upload Section */}
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          Upload Assignment File
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a PDF or Word document containing assignment questions (optional).
        </Typography>

        {uploadedFile ? (
          <Card
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'success.50',
              borderColor: 'success.main',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
              <FileText size={24} color="#2e7d32" />
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="body1" fontWeight="medium" noWrap>
                  {getFileIcon(uploadedFile.name)} {uploadedFile.name}
                </Typography>
                <Chip
                  label="Uploaded"
                  size="small"
                  color="success"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Button
                variant="outlined"
                size="small"
                component="label"
                startIcon={<Upload size={16} />}
              >
                Replace
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                />
              </Button>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveFile()}
                title="Remove file"
              >
                <X size={18} />
              </IconButton>
            </Box>
          </Card>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={uploading ? <CircularProgress size={18} /> : <Upload size={18} />}
              disabled={uploading}
              sx={{
                p: 2,
                width: '100%',
                borderStyle: 'dashed',
                borderWidth: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                minHeight: 100,
              }}
            >
              <File size={28} />
              <span>{uploading ? 'Uploading...' : 'Click to upload file'}</span>
              <Typography variant="caption" color="text.secondary">
                Supported: PDF, DOC, DOCX (Max 20MB)
              </Typography>
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>
        )}

        {fileError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fileError}
          </Alert>
        )}
      </Paper>

      <NotificationModal
        open={modal.open}
        onClose={() => {
          if (modal.onAction) {
            modal.onAction()
          } else {
            closeModal()
          }
        }}
        title={modal.title}
        message={modal.message}
        severity={modal.severity}
        autoCloseMs={modal.autoCloseMs}
        actionLabel={modal.actionLabel}
        onAction={modal.onAction}
      />
    </Box>
  )
}
