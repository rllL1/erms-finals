'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  CircularProgress,
} from '@mui/material'
import { ArrowLeft, Save } from 'lucide-react'
import NotificationModal, { type ModalSeverity } from '../../components/NotificationModal'

interface Assignment {
  id: string
  title: string
  description?: string
  start_date: string | null
  end_date: string | null
  due_date?: string | null
  allowed_file_types?: string[]
  max_file_size?: number
}

interface EditAssignmentClientProps {
  assignment: Assignment
}

const FILE_TYPE_OPTIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.zip',
  '.rar',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
]

export default function EditAssignmentClient({ assignment: initialAssignment }: EditAssignmentClientProps) {
  const router = useRouter()
  const [assignment, setAssignment] = useState(initialAssignment)
  const [saving, setSaving] = useState(false)

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
          allowed_file_types: assignment.allowed_file_types,
          max_file_size: assignment.max_file_size,
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
    } catch (error) {
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
          label="Description"
          multiline
          rows={6}
          value={assignment.description || ''}
          onChange={(e) => setAssignment({ ...assignment, description: e.target.value })}
          margin="normal"
          helperText="Provide detailed instructions for the assignment"
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

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Submission Settings
        </Typography>

        <FormControl fullWidth margin="normal">
          <InputLabel>Allowed File Types</InputLabel>
          <Select
            multiple
            value={assignment.allowed_file_types || []}
            onChange={(e) => setAssignment({ 
              ...assignment, 
              allowed_file_types: typeof e.target.value === 'string' 
                ? e.target.value.split(',') 
                : e.target.value 
            })}
            input={<OutlinedInput label="Allowed File Types" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {FILE_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Maximum File Size (MB)"
          type="number"
          value={assignment.max_file_size ? (assignment.max_file_size / (1024 * 1024)).toFixed(1) : ''}
          onChange={(e) => setAssignment({ 
            ...assignment, 
            max_file_size: parseFloat(e.target.value) * 1024 * 1024 
          })}
          margin="normal"
          inputProps={{ min: 0.1, max: 100, step: 0.1 }}
          helperText="Maximum file size students can upload (0.1 - 100 MB)"
        />

        <Alert severity="info" sx={{ mt: 3 }}>
          Students will submit their work by uploading files. Make sure to set appropriate file types and size limits.
        </Alert>
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
