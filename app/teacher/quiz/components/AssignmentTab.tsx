'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
} from '@mui/material'
import { Plus, Eye, Edit, Trash2, Users, X, Calendar, FileText } from 'lucide-react'
import NotificationModal, { type ModalSeverity } from '@/app/components/NotificationModal'
import ConfirmationModal from '@/app/components/ConfirmationModal'

interface Assignment {
  id: string
  title: string
  type: string
  description?: string
  question_count: number
  start_date: string | null
  end_date: string | null
  due_date?: string
  allowed_file_types?: string[]
  max_file_size?: number
  submission_count?: number
  created_at: string
}

export default function AssignmentTab({ teacherId }: { teacherId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ open: boolean; severity: ModalSeverity; message: string }>({ open: false, severity: 'success', message: '' })

  useEffect(() => {
    fetchAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, searchParams])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/assignments?teacherId=${teacherId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched assignments:', data.assignments)
        setAssignments(data.assignments || [])
      } else {
        console.error('Failed to fetch assignments:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setAssignments(assignments.filter(a => a.id !== assignmentId))
        setDeleteModalOpen(false)
        setAssignmentToDelete(null)
        setNotification({ open: true, severity: 'success', message: 'Assignment deleted successfully!' })
      } else {
        setDeleteModalOpen(false)
        setNotification({ open: true, severity: 'error', message: 'Failed to delete assignment. Please try again.' })
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      setDeleteModalOpen(false)
      setNotification({ open: true, severity: 'error', message: 'An error occurred while deleting the assignment.' })
    }
  }

  const handleView = async (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setViewModalOpen(true)
  }

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setEditModalOpen(true)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Assignments</Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => router.push('/teacher/quiz/create-assignment')}
        >
          Create Assignment
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Due Date</strong></TableCell>
              <TableCell><strong>File Types</strong></TableCell>
              <TableCell><strong>Submissions</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No assignments created yet. Click &apos;Create Assignment&apos; to get started.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell>{assignment.title}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {assignment.description}
                  </TableCell>
                  <TableCell>{assignment.due_date ? formatDate(assignment.due_date) : assignment.end_date ? formatDate(assignment.end_date) : '-'}</TableCell>
                  <TableCell>
                    {Array.isArray(assignment.allowed_file_types) && assignment.allowed_file_types.slice(0, 2).map((type, idx) => (
                      <Chip 
                        key={idx}
                        label={type} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {Array.isArray(assignment.allowed_file_types) && assignment.allowed_file_types.length > 2 && (
                      <Chip label={`+${assignment.allowed_file_types.length - 2}`} size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={<Users size={14} />}
                      label={assignment.submission_count || 0} 
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>{formatDate(assignment.created_at)}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleView(assignment)}
                      title="View Details"
                    >
                      <Eye size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="info"
                      onClick={() => handleEdit(assignment)}
                      title="Edit Assignment"
                    >
                      <Edit size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => {
                        setAssignmentToDelete(assignment.id)
                        setDeleteModalOpen(true)
                      }}
                      title="Delete Assignment"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Modal */}
      <Dialog 
        open={viewModalOpen} 
        onClose={() => setViewModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Assignment Details
          <IconButton onClick={() => setViewModalOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAssignment && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <FileText size={32} />
                <Typography variant="h5">
                  {selectedAssignment.title}
                </Typography>
              </Box>

              {selectedAssignment.description && (
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedAssignment.description}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Chip 
                  icon={<Users size={16} />}
                  label={`${selectedAssignment.submission_count || 0} Submissions`} 
                  color="primary"
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                Assignment Details
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Calendar size={20} color="#666" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Start Date
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {selectedAssignment.start_date ? formatDate(selectedAssignment.start_date) : 'Not set'}
                  </Typography>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Calendar size={20} color="#666" />
                    <Typography variant="subtitle2" color="text.secondary">
                      End Date
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {selectedAssignment.end_date ? formatDate(selectedAssignment.end_date) : 'Not set'}
                  </Typography>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Calendar size={20} color="#f44336" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Due Date
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {selectedAssignment.due_date ? formatDate(selectedAssignment.due_date) : 'Not set'}
                  </Typography>
                </Box>

                {selectedAssignment.max_file_size && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Maximum File Size
                    </Typography>
                    <Typography variant="body1">
                      {(selectedAssignment.max_file_size / (1024 * 1024)).toFixed(1)} MB
                    </Typography>
                  </Box>
                )}
              </Box>

              {selectedAssignment.allowed_file_types && selectedAssignment.allowed_file_types.length > 0 && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Allowed File Types
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {selectedAssignment.allowed_file_types.map((type, index) => (
                      <Chip key={index} label={type} variant="outlined" size="small" />
                    ))}
                  </Box>
                </>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                Students must submit files in one of the allowed formats before the due date.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Assignment</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click the button below to open the full assignment editor.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setEditModalOpen(false)
              router.push(`/teacher/quiz/edit-assignment/${selectedAssignment?.id}`)
            }}
          >
            Open Assignment Editor
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => assignmentToDelete && handleDelete(assignmentToDelete)}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Notification Modal */}
      <NotificationModal
        open={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
        severity={notification.severity}
        autoCloseMs={2000}
      />
    </Box>
  )
}


