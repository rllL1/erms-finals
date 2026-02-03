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
import { Plus, Eye, Edit, Trash2 } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  type: string
  quiz_type?: string
  question_count: number
  start_date: string | null
  end_date: string | null
  created_at: string
}

export default function QuizzesTab({ teacherId }: { teacherId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizzes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, searchParams])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/quizzes?teacherId=${teacherId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched quizzes:', data.quizzes)
        setQuizzes(data.quizzes || [])
      } else {
        console.error('Failed to fetch quizzes:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return

    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizId))
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">My Quizzes</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => fetchQuizzes()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => router.push('/teacher/quiz/create-quiz')}
          >
            Create Quiz
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Questions</strong></TableCell>
              <TableCell><strong>Start Date</strong></TableCell>
              <TableCell><strong>End Date</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No quizzes created yet. Click Create Quiz to get started.
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz) => (
                <TableRow key={quiz.id} hover>
                  <TableCell>{quiz.title}</TableCell>
                  <TableCell>
                    <Chip 
                      label={quiz.type} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{quiz.question_count || 0}</TableCell>
                  <TableCell>{quiz.start_date ? formatDate(quiz.start_date) : '-'}</TableCell>
                  <TableCell>{quiz.end_date ? formatDate(quiz.end_date) : '-'}</TableCell>
                  <TableCell>{formatDate(quiz.created_at)}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="primary"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="info"
                      title="Edit Quiz"
                    >
                      <Edit size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(quiz.id)}
                      title="Delete Quiz"
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
