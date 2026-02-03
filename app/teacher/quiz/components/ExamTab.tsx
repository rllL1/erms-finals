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
import { Plus, Download, Printer, Eye, Edit, Trash2 } from 'lucide-react'
import { generateExamPDF } from '../utils/pdfGenerator'

interface Exam {
  id: string
  title: string
  type: string
  period?: string
  school_name?: string
  question_count: number
  total_points?: number
  start_date: string | null
  end_date: string | null
  created_at: string
}

export default function ExamTab({ teacherId }: { teacherId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, searchParams])

  const fetchExams = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/exams?teacherId=${teacherId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched exams:', data.exams)
        setExams(data.exams || [])
      } else {
        console.error('Failed to fetch exams:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return

    try {
      const response = await fetch(`/api/teacher/exams/${examId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setExams(exams.filter(e => e.id !== examId))
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
    }
  }

  const handlePrintPreview = async (exam: Exam) => {
    // Fetch full exam details with questions
    try {
      const response = await fetch(`/api/teacher/exams/${exam.id}`)
      if (response.ok) {
        const fullExam = await response.json()
        generateExamPDF(fullExam, 'print')
      }
    } catch (error) {
      console.error('Error fetching exam details:', error)
    }
  }

  const handleDownload = async (exam: Exam) => {
    // Fetch full exam details with questions
    try {
      const response = await fetch(`/api/teacher/exams/${exam.id}`)
      if (response.ok) {
        const fullExam = await response.json()
        generateExamPDF(fullExam, 'download')
      }
    } catch (error) {
      console.error('Error fetching exam details:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getPeriodColor = (period: string) => {
    switch (period) {
      case 'prelim': return 'info'
      case 'midterm': return 'warning'
      case 'finals': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Exams</Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => router.push('/teacher/quiz/create-exam')}
        >
          Create Exam
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Period</strong></TableCell>
              <TableCell><strong>School Name</strong></TableCell>
              <TableCell><strong>Questions</strong></TableCell>
              <TableCell><strong>Total Points</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No exams created yet. Click Create Exam to get started.
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id} hover>
                  <TableCell>{exam.title}</TableCell>
                  <TableCell>
                    <Chip 
                      label={exam.period ? exam.period.toUpperCase() : 'N/A'} 
                      size="small" 
                      color={exam.period ? getPeriodColor(exam.period) : 'default'}
                    />
                  </TableCell>
                  <TableCell>{exam.school_name}</TableCell>
                  <TableCell>{exam.question_count || 0}</TableCell>
                  <TableCell>{exam.total_points || 0} pts</TableCell>
                  <TableCell>{formatDate(exam.created_at)}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="secondary"
                      onClick={() => handlePrintPreview(exam)}
                      title="Print Preview PDF"
                    >
                      <Printer size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => handleDownload(exam)}
                      title="Download PDF"
                    >
                      <Download size={18} />
                    </IconButton>
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
                      title="Edit Exam"
                    >
                      <Edit size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(exam.id)}
                      title="Delete Exam"
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
