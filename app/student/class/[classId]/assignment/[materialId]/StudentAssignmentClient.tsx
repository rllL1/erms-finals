'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { ArrowLeft, Clock, Send, FileText, Upload, Download, Eye, X, File } from 'lucide-react'
import NotificationModal, { type ModalSeverity } from '@/app/components/NotificationModal'

interface Student {
  id: string
  student_name: string
  email: string
}

interface Quiz {
  id: string
  title: string
  type: string
  quiz_type?: string
  attachment_url?: string
  attachment_name?: string
  description?: string
}

interface Material {
  id: string
  title: string
  description?: string
  time_limit?: number
  due_date?: string
  quiz_id: string
  quizzes?: Quiz
}

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function StudentAssignmentClient({
  classId,
  materialId,
  student,
}: {
  classId: string
  materialId: string
  student: Student
}) {
  const router = useRouter()
  const [material, setMaterial] = useState<Material | null>(null)
  const [assignment, setAssignment] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingSubmission, setExistingSubmission] = useState<any>(null)

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    url: string
    storagePath: string
  } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState('')

  // PDF preview
  const [previewDialog, setPreviewDialog] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  // Notification modal
  const [notification, setNotification] = useState<{
    open: boolean
    title?: string
    message: string
    severity: ModalSeverity
    actionLabel?: string
    onAction?: () => void
  }>({ open: false, message: '', severity: 'info' })

  useEffect(() => {
    setMounted(true)
    fetchMaterialAndAssignment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId])

  const fetchMaterialAndAssignment = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/student/classes/${classId}/materials?studentId=${student.id}`
      )
      const data = await response.json()

      if (response.ok) {
        const foundMaterial = data.materials?.find((m: Material) => m.id === materialId)
        if (foundMaterial) {
          setMaterial(foundMaterial)
          await fetchAssignmentDetails(foundMaterial.quiz_id)
          await checkExistingSubmission()
        } else {
          setError('Assignment not found')
        }
      }
    } catch (_err) {
      setError('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignmentDetails = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`)
      const data = await response.json()

      if (response.ok && data.assignment) {
        setAssignment(data.assignment)
      }
    } catch (err) {
      console.error('Error fetching assignment:', err)
    }
  }

  const checkExistingSubmission = async () => {
    try {
      const response = await fetch(
        `/api/student/submit-assignment?materialId=${materialId}&studentId=${student.id}`
      )
      const data = await response.json()
      if (data.submission) {
        setExistingSubmission(data.submission)
      }
    } catch (err) {
      console.error('Error checking existing submission:', err)
    }
  }

  const isPdf = (url: string) => url?.toLowerCase().includes('.pdf')
  const _isWord = (url: string) => url?.toLowerCase().match(/\.(doc|docx)$/)

  const handlePreviewPdf = (url: string, title: string) => {
    setPreviewUrl(url)
    setPreviewTitle(title)
    setPreviewDialog(true)
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

    if (uploadedFile) {
      setUploadedFile(null)
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/student/upload-assignment-file', {
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

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setFileError('')
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')

      if (!uploadedFile) {
        setError('Please upload your answer file before submitting')
        return
      }

      const response = await fetch('/api/student/submit-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          material_id: materialId,
          assignment_id: material?.quiz_id,
          assignment_file_url: uploadedFile.url,
          assignment_response: uploadedFile.name,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({
          open: true,
          severity: 'success',
          title: 'Submitted!',
          message: 'Your assignment has been submitted successfully.',
          actionLabel: 'Back to Class',
          onAction: () => {
            router.push(`/student/class/${classId}`)
          },
        })
        setExistingSubmission(data.submission)
      } else {
        setError(data.error || 'Failed to submit assignment')
      }
    } catch (_err) {
      setError('An error occurred while submitting')
    } finally {
      setSubmitting(false)
    }
  }

  const isDueSoon = () => {
    if (!material?.due_date) return false
    const now = new Date()
    const due = new Date(material.due_date)
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilDue > 0 && hoursUntilDue <= 24
  }

  const isOverdue = () => {
    if (!material?.due_date) return false
    return new Date(material.due_date) < new Date()
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!material) {
    return (
      <Box sx={{ maxWidth: '1536px', mx: 'auto', mt: 4, px: 2 }}>
        <Alert severity="error">Assignment not found</Alert>
      </Box>
    )
  }

  const alreadySubmitted = !!existingSubmission

  return (
    <Box sx={{ maxWidth: '1024px', mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      <Button
        startIcon={<ArrowLeft />}
        onClick={() => router.push(`/student/class/${classId}`)}
        sx={{ mb: 2 }}
        disabled={submitting}
      >
        Back to Class
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Assignment Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <FileText size={24} />
            <Typography variant="h4">
              {material.title}
            </Typography>
          </Box>

          {material.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {material.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {material.due_date && (
              <Chip
                icon={<Clock size={16} />}
                label={`Due: ${new Date(material.due_date).toLocaleString()}`}
                color={isOverdue() ? 'error' : isDueSoon() ? 'warning' : 'default'}
              />
            )}
            {material.time_limit && (
              <Chip label={`${material.time_limit} minutes`} />
            )}
            {alreadySubmitted && (
              <Chip label="Already Submitted" color="success" />
            )}
          </Box>

          {isOverdue() && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This assignment is overdue. Late submissions may receive reduced points.
            </Alert>
          )}

          {isDueSoon() && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This assignment is due soon!
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Teacher's Assignment File / Questions */}
      {assignment && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assignment Questions
            </Typography>

            {/* Show text description/questions if any */}
            {assignment.description && assignment.description !== 'See attached file for assignment questions.' && (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {assignment.description}
              </Typography>
            )}

            {/* Show teacher's uploaded file */}
            {assignment.attachment_url && (
              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: '#eff6ff',
                  borderColor: '#2563eb',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <FileText size={24} color="#2563eb" />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" fontWeight="medium" noWrap>
                      {assignment.attachment_name || 'Assignment File'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isPdf(assignment.attachment_url) ? 'PDF Document' : 'Word Document'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {isPdf(assignment.attachment_url) && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Eye size={16} />}
                        onClick={() => handlePreviewPdf(assignment.attachment_url!, assignment.attachment_name || 'Assignment')}
                      >
                        View PDF
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Download size={16} />}
                      component="a"
                      href={assignment.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </Button>
                  </Box>
                </Box>

                {/* Embedded PDF viewer */}
                {isPdf(assignment.attachment_url) && (
                  <Box sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                    <iframe
                      src={assignment.attachment_url}
                      style={{ width: '100%', height: '500px', border: 'none' }}
                      title="Assignment PDF"
                    />
                  </Box>
                )}
              </Card>
            )}

            {/* Fallback if there's no file and no meaningful description */}
            {!assignment.attachment_url && !assignment.description && (
              <Typography variant="body2" color="text.secondary">
                No specific instructions provided.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Submission Section */}
      {!alreadySubmitted ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Your Answer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload your answer file in PDF or Word format (.pdf, .doc, .docx).
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
                  bgcolor: '#f0fdf4',
                  borderColor: '#16a34a',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                  <FileText size={24} color="#2e7d32" />
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="body1" fontWeight="medium" noWrap>
                      {uploadedFile.name}
                    </Typography>
                    <Chip label="Ready to submit" size="small" color="success" sx={{ mt: 0.5 }} />
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
                    onClick={handleRemoveFile}
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
                  <span>{uploading ? 'Uploading...' : 'Click to upload your answer file'}</span>
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon />
            <Typography variant="h6" sx={{ mt: 1 }} color="success.main">
              Assignment Submitted
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You have already submitted this assignment.
            </Typography>
            {existingSubmission?.score !== null && existingSubmission?.score !== undefined && (
              <Chip
                label={`Score: ${existingSubmission.score}/${existingSubmission.max_score}`}
                color="primary"
                sx={{ mt: 2 }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {!alreadySubmitted && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={submitting ? <CircularProgress size={20} /> : <Send size={20} />}
            onClick={handleSubmit}
            disabled={submitting || !uploadedFile}
            sx={{
              bgcolor: 'rgb(147, 51, 234)',
              '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
              '&:disabled': { bgcolor: 'grey.300' },
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </Box>
      )}

      {/* PDF Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{previewTitle}</DialogTitle>
        <DialogContent sx={{ p: 0, height: '75vh' }}>
          <iframe
            src={previewUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="PDF Preview"
          />
        </DialogContent>
        <DialogActions>
          <Button
            component="a"
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Download size={16} />}
          >
            Download
          </Button>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Modal */}
      <NotificationModal
        open={notification.open}
        onClose={() => {
          if (notification.onAction) {
            notification.onAction()
          } else {
            setNotification(prev => ({ ...prev, open: false }))
          }
        }}
        title={notification.title}
        message={notification.message}
        severity={notification.severity}
        actionLabel={notification.actionLabel}
        onAction={notification.onAction}
      />
    </Box>
  )
}

function CheckCircleIcon() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: '#f0fdf4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </Box>
    </Box>
  )
}
