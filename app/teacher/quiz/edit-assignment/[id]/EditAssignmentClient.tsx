'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
} from '@mui/material'
import { ArrowLeft, Save } from 'lucide-react'

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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

      setMessage({ type: 'success', text: 'Assignment updated successfully!' })
      setTimeout(() => {
        router.push('/teacher/quiz')
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save assignment. Please try again.' })
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
          startIcon={<Save />}
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
            value={formatDateForInput(assignment.due_date)}
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

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
      >
        <Alert severity={message?.type} onClose={() => setMessage(null)}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  )
}
