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
} from '@mui/material'
import { Plus, Eye, Edit, Trash2, Users } from 'lucide-react'

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
  submission_count?: number
  created_at: string
}

export default function AssignmentTab({ teacherId }: { teacherId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

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
    if (!confirm('Are you sure you want to delete this assignment?')) return

    try {
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setAssignments(assignments.filter(a => a.id !== assignmentId))
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
    }
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
                      title="View Submissions"
                    >
                      <Eye size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="info"
                      title="Edit Assignment"
                    >
                      <Edit size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(assignment.id)}
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
    </Box>
  )
}

