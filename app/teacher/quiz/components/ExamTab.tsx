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
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import { Plus, Eye, Edit, Trash2, Download, Printer, X } from 'lucide-react'
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

interface Question {
  id: string
  question: string
  question_type: string
  options?: string[]
  correct_answer?: string
  points?: number
  order_number: number
}

interface ExamDetails extends Exam {
  introduction?: string
  show_answer_key?: boolean
  questions?: Question[]
}

export default function ExamTab({ teacherId }: { teacherId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<ExamDetails | null>(null)
  const [examToDelete, setExamToDelete] = useState<string | null>(null)

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
    try {
      const response = await fetch(`/api/teacher/exams/${examId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setExams(exams.filter(e => e.id !== examId))
        setDeleteModalOpen(false)
        setExamToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
    }
  }

  const handleView = async (exam: Exam) => {
    try {
      console.log('Fetching exam details for:', exam.id)
      const response = await fetch(`/api/teacher/exams/${exam.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Exam details response:', data)
        // Map API response to match our interface
        const examDetails: ExamDetails = {
          ...exam,
          introduction: data.introduction,
          show_answer_key: data.show_answer_key,
          school_name: data.schoolName || exam.school_name,
          questions: data.questions?.map((q: any) => ({
            id: q.id,
            question: q.question,
            question_type: q.type || q.question_type || 'short-answer',
            options: Array.isArray(q.options) 
              ? q.options 
              : (q.options?.options ? q.options.options : []),
            correct_answer: q.correct_answer,
            points: q.points || 1,
            order_number: q.order_number || 0,
          })) || []
        }
        console.log('Setting exam details:', examDetails)
        setSelectedExam(examDetails)
        setViewModalOpen(true)
      } else {
        console.error('Failed to fetch exam details:', response.status)
      }
    } catch (error) {
      console.error('Error fetching exam details:', error)
    }
  }

  const handleEdit = async (exam: Exam) => {
    setSelectedExam(exam)
    setEditModalOpen(true)
  }

  const handlePrintPreview = () => {
    if (selectedExam && selectedExam.questions) {
      const examData = {
        id: selectedExam.id,
        title: selectedExam.title,
        period: selectedExam.period || 'general',
        schoolName: selectedExam.school_name || 'School Name',
        introduction: selectedExam.introduction || '',
        questions: selectedExam.questions.map(q => ({
          id: q.id,
          type: q.question_type,
          question: q.question,
          options: q.options,
          points: q.points || 1,
        }))
      }
      generateExamPDF(examData, 'print')
    }
  }

  const handleDownloadPDF = () => {
    if (selectedExam && selectedExam.questions) {
      const examData = {
        id: selectedExam.id,
        title: selectedExam.title,
        period: selectedExam.period || 'general',
        schoolName: selectedExam.school_name || 'School Name',
        introduction: selectedExam.introduction || '',
        questions: selectedExam.questions.map(q => ({
          id: q.id,
          type: q.question_type,
          question: q.question,
          options: q.options,
          points: q.points || 1,
        }))
      }
      generateExamPDF(examData, 'download')
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
                      color="primary"
                      onClick={() => handleView(exam)}
                      title="View Details"
                    >
                      <Eye size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="info"
                      onClick={() => handleEdit(exam)}
                      title="Edit Exam"
                    >
                      <Edit size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => {
                        setExamToDelete(exam.id)
                        setDeleteModalOpen(true)
                      }}
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

      {/* View Modal */}
      <Dialog 
        open={viewModalOpen} 
        onClose={() => setViewModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Exam Details
          <IconButton onClick={() => setViewModalOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedExam && (
            <Box>
              <Paper sx={{ p: 3, mb: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {selectedExam.school_name || 'School Name'}
                </Typography>
                <Typography variant="h4" gutterBottom>
                  {selectedExam.title}
                </Typography>
                {selectedExam.period && (
                  <Chip 
                    label={selectedExam.period.toUpperCase() + ' EXAMINATION'} 
                    color={getPeriodColor(selectedExam.period)}
                  />
                )}
              </Paper>

              {selectedExam.introduction && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Instructions
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedExam.introduction}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Chip label={`Questions: ${selectedExam.questions?.length || 0}`} />
                <Chip 
                  label={`Total Points: ${selectedExam.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0}`} 
                  color="success" 
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                Questions
              </Typography>
              {selectedExam.questions && selectedExam.questions.length > 0 ? (
                selectedExam.questions.map((question, index) => (
                  <Card key={question.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {index + 1}. {question.question}
                        </Typography>
                        <Chip label={`${question.points || 1} pts`} size="small" color="primary" />
                      </Box>
                      
                      {question.question_type === 'multiple-choice' && question.options && Array.isArray(question.options) && (
                        <Box sx={{ ml: 2, mt: 1 }}>
                          {question.options.map((option, optIndex) => (
                            <Typography 
                              key={optIndex} 
                              variant="body2" 
                              sx={{ 
                                py: 0.5,
                                fontWeight: option === question.correct_answer ? 'bold' : 'normal',
                                color: option === question.correct_answer ? 'success.main' : 'inherit'
                              }}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {option === question.correct_answer && ' ✓'}
                            </Typography>
                          ))}
                        </Box>
                      )}

                      {question.question_type === 'true-false' && (
                        <Box sx={{ ml: 2, mt: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: question.correct_answer === 'true' ? 'bold' : 'normal',
                              color: question.correct_answer === 'true' ? 'success.main' : 'inherit'
                            }}
                          >
                            True {question.correct_answer === 'true' && '✓'}
                          </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              fontWeight: question.correct_answer === 'false' ? 'bold' : 'normal',
                              color: question.correct_answer === 'false' ? 'success.main' : 'inherit'
                            }}
                          >
                            False {question.correct_answer === 'false' && '✓'}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography color="text.secondary">No questions added yet.</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrintPreview} startIcon={<Printer />} color="secondary">
            Print Preview
          </Button>
          <Button onClick={handleDownloadPDF} startIcon={<Download />} color="success">
            Download PDF
          </Button>
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
        <DialogTitle>Edit Exam</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click the button below to open the full exam editor.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setEditModalOpen(false)
              router.push(`/teacher/quiz/edit-exam/${selectedExam?.id}`)
            }}
          >
            Open Exam Editor
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog 
        open={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this exam? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => examToDelete && handleDelete(examToDelete)} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
