'use client'

import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  Divider,
  Alert,
} from '@mui/material'
import { ArrowLeft, Edit, FileText, Calendar, Users } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description?: string
  start_date: string | null
  end_date: string | null
  due_date?: string | null
  allowed_file_types?: string[]
  max_file_size?: number
  created_at: string
}

interface ViewAssignmentClientProps {
  assignment: Assignment
  submissionsCount: number
}

export default function ViewAssignmentClient({ assignment, submissionsCount }: ViewAssignmentClientProps) {
  const router = useRouter()

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date()

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => router.push('/teacher/quiz')}
          variant="outlined"
        >
          Back to Assignments
        </Button>
        <Button
          startIcon={<Edit />}
          onClick={() => router.push(`/teacher/quiz/edit-assignment/${assignment.id}`)}
          variant="contained"
          color="primary"
        >
          Edit Assignment
        </Button>
      </Box>

      {/* Assignment Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FileText size={32} />
          <Typography variant="h4">
            {assignment.title}
          </Typography>
        </Box>

        {assignment.description && (
          <Typography variant="body1" color="text.secondary" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
            {assignment.description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            icon={<Users size={16} />}
            label={`${submissionsCount} Submission${submissionsCount !== 1 ? 's' : ''}`} 
            color="primary"
          />
          {isOverdue && (
            <Chip label="Overdue" color="error" />
          )}
        </Box>
      </Paper>

      {/* Assignment Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Assignment Details
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Calendar size={20} color="#666" />
              <Typography variant="subtitle2" color="text.secondary">
                Start Date
              </Typography>
            </Box>
            <Typography variant="body1">{formatDate(assignment.start_date)}</Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Calendar size={20} color="#666" />
              <Typography variant="subtitle2" color="text.secondary">
                End Date
              </Typography>
            </Box>
            <Typography variant="body1">{formatDate(assignment.end_date)}</Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Calendar size={20} color="#f44336" />
              <Typography variant="subtitle2" color="text.secondary">
                Due Date
              </Typography>
            </Box>
            <Typography variant="body1" color={isOverdue ? 'error' : 'inherit'}>
              {formatDate(assignment.due_date)}
              {isOverdue && ' (Overdue)'}
            </Typography>
          </Box>

          {assignment.max_file_size && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Maximum File Size
              </Typography>
              <Typography variant="body1">
                {(assignment.max_file_size / (1024 * 1024)).toFixed(1)} MB
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Submission Requirements */}
      {assignment.allowed_file_types && assignment.allowed_file_types.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Submission Requirements
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Allowed File Types
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {assignment.allowed_file_types.map((type, index) => (
                <Chip key={index} label={type} variant="outlined" size="small" />
              ))}
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Students must submit files in one of the allowed formats before the due date.
          </Alert>
        </Paper>
      )}

      {/* View Submissions Button */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Users />}
          onClick={() => router.push(`/teacher/assignments/${assignment.id}/submissions`)}
        >
          View All Submissions ({submissionsCount})
        </Button>
      </Box>
    </Box>
  )
}
