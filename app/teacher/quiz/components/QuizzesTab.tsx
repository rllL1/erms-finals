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
  FormControlLabel,
  Radio,
} from '@mui/material'
import { Plus, Eye, Edit, Trash2, X } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  type: string
  quiz_type?: string
  description?: string
  time_limit?: number
  question_count: number
  start_date: string | null
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
  image_url?: string
}

interface QuizDetails extends Quiz {
  questions?: Question[]
}

export default function QuizzesTab({ teacherId }: { teacherId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetails | null>(null)
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null)

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
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizId))
        setDeleteModalOpen(false)
        setQuizToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
    }
  }

  const handleView = async (quiz: Quiz) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quiz.id}`)
      if (response.ok) {
        const data = await response.json()
        const quizDetails: QuizDetails = {
          ...quiz,
          description: data.quiz?.description,
          time_limit: data.quiz?.time_limit,
          questions: data.quiz?.quiz_questions?.map((q: any) => ({
            ...q,
            // Ensure options is always an array
            options: Array.isArray(q.options) 
              ? q.options 
              : (q.options?.options ? q.options.options : [])
          })) || []
        }
        setSelectedQuiz(quizDetails)
        setViewModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching quiz details:', error)
    }
  }

  const handleEdit = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setEditModalOpen(true)
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
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Loading...</TableCell>
              </TableRow>
            ) : quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
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
                  <TableCell>{formatDate(quiz.created_at)}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleView(quiz)}
                      title="View Details"
                    >
                      <Eye size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="info"
                      onClick={() => handleEdit(quiz)}
                      title="Edit Quiz"
                    >
                      <Edit size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => {
                        setQuizToDelete(quiz.id)
                        setDeleteModalOpen(true)
                      }}
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

      {/* View Modal */}
      <Dialog 
        open={viewModalOpen} 
        onClose={() => setViewModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Quiz Details
          <IconButton onClick={() => setViewModalOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedQuiz && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {selectedQuiz.title}
              </Typography>
              
              {selectedQuiz.description && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {selectedQuiz.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                {selectedQuiz.quiz_type && (
                  <Chip label={`Type: ${selectedQuiz.quiz_type}`} color="primary" />
                )}
                {selectedQuiz.time_limit && (
                  <Chip label={`Time Limit: ${selectedQuiz.time_limit} min`} color="secondary" />
                )}
                <Chip label={`Questions: ${selectedQuiz.questions?.length || 0}`} />
                <Chip 
                  label={`Total Points: ${selectedQuiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0}`} 
                  color="success" 
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Questions
              </Typography>
              {selectedQuiz.questions && selectedQuiz.questions.length > 0 ? (
                selectedQuiz.questions.map((question, index) => (
                  <Card key={question.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {index + 1}. {question.question}
                        </Typography>
                        <Chip label={`${question.points || 1} pts`} size="small" color="primary" />
                      </Box>

                      {/* Display question image if available */}
                      {question.image_url && (
                        <Box sx={{ mb: 2, mt: 1, textAlign: 'center' }}>
                          <img 
                            src={question.image_url} 
                            alt={`Question ${index + 1} image`}
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '200px', 
                              borderRadius: '8px',
                              border: '1px solid #ddd'
                            }} 
                          />
                        </Box>
                      )}

                      {question.question_type === 'multiple-choice' && question.options && Array.isArray(question.options) && (
                        <Box sx={{ ml: 2, mt: 1 }}>
                          {question.options.map((option, optIndex) => (
                            <FormControlLabel
                              key={optIndex}
                              control={
                                <Radio 
                                  checked={option === question.correct_answer}
                                  disabled
                                />
                              }
                              label={
                                <span>
                                  {option}
                                  {option === question.correct_answer && (
                                    <Chip 
                                      label="Correct" 
                                      size="small" 
                                      color="success" 
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </span>
                              }
                            />
                          ))}
                        </Box>
                      )}

                      {question.question_type === 'true-false' && (
                        <Box sx={{ ml: 2, mt: 1 }}>
                          <FormControlLabel
                            control={<Radio checked={question.correct_answer === 'true'} disabled />}
                            label={
                              <span>
                                True
                                {question.correct_answer === 'true' && (
                                  <Chip label="Correct" size="small" color="success" sx={{ ml: 1 }} />
                                )}
                              </span>
                            }
                          />
                          <FormControlLabel
                            control={<Radio checked={question.correct_answer === 'false'} disabled />}
                            label={
                              <span>
                                False
                                {question.correct_answer === 'false' && (
                                  <Chip label="Correct" size="small" color="success" sx={{ ml: 1 }} />
                                )}
                              </span>
                            }
                          />
                        </Box>
                      )}

                      {(question.question_type === 'short-answer' || question.question_type === 'essay') && (
                        <Box sx={{ ml: 2, mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {question.question_type === 'essay' 
                              ? 'Student will provide a detailed essay answer (manually graded)'
                              : 'Student will provide a written answer (manually graded)'}
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
        <DialogTitle>Edit Quiz</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click the button below to open the full quiz editor.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setEditModalOpen(false)
              router.push(`/teacher/quiz/edit-quiz/${selectedQuiz?.id}`)
            }}
          >
            Open Quiz Editor
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
            Are you sure you want to delete this quiz? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => quizToDelete && handleDelete(quizToDelete)} 
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
