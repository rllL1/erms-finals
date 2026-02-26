'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material'
import { ArrowLeft, Upload, FileText, X, File } from 'lucide-react'
import NotificationModal, { type ModalSeverity } from '../components/NotificationModal'

interface Teacher {
  id: string
  teacher_name: string
  email: string
}

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function CreateAssignmentClient({ teacher }: { teacher: Teacher }) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    url: string
    storagePath: string
  } | null>(null)
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

    // Reset input so re-selecting same file triggers change event
    e.target.value = ''
    setFileError('')

    // Validate file extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
    if (!hasValidExtension) {
      setFileError('Invalid file type. Only PDF (.pdf) and Word documents (.doc, .docx) are allowed.')
      return
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError('Invalid file type. Only PDF and Word documents are allowed.')
      return
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setFileError('File too large. Maximum size is 20MB.')
      return
    }

    // If a file was already uploaded, remove it first
    if (uploadedFile) {
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

    try {
      await fetch(`/api/teacher/upload-assignment-file?storagePath=${encodeURIComponent(uploadedFile.storagePath)}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error removing file:', error)
    }

    setUploadedFile(null)
    if (showFeedback) {
      setFileError('')
    }
  }

  const handleCreateAssignment = async () => {
    if (!description && !uploadedFile) {
      showModal('warning', 'Please provide assignment questions text or upload a questions file (PDF/Word).')
      return
    }

    setLoading(true)
    try {
      const title = uploadedFile
        ? uploadedFile.name.replace(/\.[^/.]+$/, '')
        : (description.substring(0, 60) + (description.length > 60 ? '...' : ''))

      const response = await fetch('/api/teacher/create-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          title,
          description: description || 'See attached file for assignment questions.',
          dueDate: null,
          attachmentUrl: uploadedFile?.url || null,
          attachmentName: uploadedFile?.name || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        throw new Error(errorData.error || 'Failed to create assignment')
      }

      showModal('success', 'Your assignment was created successfully.', {
        title: 'Assignment Created!',
        actionLabel: 'Go to Quizzes',
        onAction: () => {
          closeModal()
          router.push('/teacher/quiz')
          router.refresh()
        },
        autoCloseMs: 5000,
      })
    } catch (error) {
      console.error('Error creating assignment:', error)
      showModal('error', `Failed to create assignment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/teacher/quiz')} sx={{ mr: 2 }}>
          <ArrowLeft />
        </IconButton>
        <Typography variant="h4">Create New Assignment</Typography>
      </Box>

      <Card sx={{ p: 3 }}>
        {/* Upload Questions File Section */}
        <Typography variant="h6" gutterBottom>
          Upload Questions File
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a PDF or Word document containing assignment questions.
        </Typography>

        {uploadedFile ? (
          <Card
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: '#f0fdf4',
              borderColor: '#16a34a',
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
          <Box sx={{ mb: 3 }}>
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
              <span>{uploading ? 'Uploading...' : 'Click to upload questions file'}</span>
              <Typography variant="caption" color="text.secondary">
                Accepted: PDF (.pdf), Word (.doc, .docx) — Max 20MB
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

        {/* Optional description / additional instructions */}
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Assignment Questions / Instructions (Optional if file uploaded)"
          placeholder="Type assignment questions or additional instructions here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/teacher/quiz')}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateAssignment}
            variant="contained"
            disabled={loading || (!description && !uploadedFile)}
            fullWidth
            sx={{
              bgcolor: 'rgb(147, 51, 234)',
              '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Assignment'}
          </Button>
        </Box>
      </Card>

      {/* Notification Modal */}
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
