'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { ArrowLeft, Eye, CheckCircle, XCircle, Edit } from 'lucide-react'

interface Teacher {
  id: string
  teacher_name: string
  email: string
}

interface Material {
  id: string
  title: string
  description?: string
  material_type: string
  due_date?: string
  time_limit?: number
}

interface Submission {
  id: string
  student_id: string
  submitted_at: string
  score: number | null
  max_score: number
  is_graded: boolean
  auto_graded: boolean
  status: string
  quiz_answers: any
  students?: {
    id: string
    student_name: string
    email: string
  }
}

export default function MaterialSubmissionsClient({
  classId,
  materialId,
  teacher,
}: {
  classId: string
  materialId: string
  teacher: Teacher
}) {
  const router = useRouter()
  const [material, setMaterial] = useState<Material | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const [viewDialog, setViewDialog] = useState(false)
  const [gradeDialog, setGradeDialog] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' })

  useEffect(() => {
    setMounted(true)
    fetchMaterial()
    fetchSubmissions()
  }, [materialId])

  const fetchMaterial = async () => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/materials`)
      const data = await response.json()
      
      if (response.ok) {
        const found = data.materials?.find((m: Material) => m.id === materialId)
        if (found) setMaterial(found)
      }
    } catch (err) {
      console.error('Error fetching material:', err)
    }
  }

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/teacher/classes/${classId}/materials/${materialId}/submissions`
      )
      const data = await response.json()
      
      if (response.ok) {
        setSubmissions(data.submissions || [])
      } else {
        setError(data.error || 'Failed to fetch submissions')
      }
    } catch (err) {
      setError('An error occurred while fetching submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setViewDialog(true)
  }

  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setGradeForm({
      score: submission.score?.toString() || '',
      feedback: '',
    })
    setGradeDialog(true)
  }

  const submitGrade = async () => {
    if (!selectedSubmission) return

    try {
      const response = await fetch(
        `/api/teacher/classes/${classId}/materials/${materialId}/submissions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: selectedSubmission.id,
            score: parseFloat(gradeForm.score),
            max_score: selectedSubmission.max_score,
            teacher_id: teacher.id,
          }),
        }
      )

      if (response.ok) {
        setSuccess('Grade submitted successfully')
        setGradeDialog(false)
        fetchSubmissions()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit grade')
      }
    } catch (err) {
      setError('An error occurred')
    }
  }

  const getScoreColor = (score: number | null, maxScore: number) => {
    if (score === null) return 'default'
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return 'success'
    if (percentage >= 75) return 'primary'
    if (percentage >= 60) return 'warning'
    return 'error'
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

  return (
    <Box sx={{ maxWidth: '1536px', mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      <Button
        startIcon={<ArrowLeft />}
        onClick={() => router.push(`/teacher/group-class/${classId}`)}
        sx={{ mb: 2 }}
      >
        Back to Class
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {material?.title || 'Material Submissions'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={material?.material_type || 'Material'}
              color={material?.material_type === 'quiz' ? 'primary' : 'secondary'}
            />
            <Chip label={`${submissions.length} Submissions`} />
            <Chip
              label={`${submissions.filter((s) => s.is_graded).length} Graded`}
              color="success"
            />
          </Box>
        </CardContent>
      </Card>

      {submissions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No submissions yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Submitted At</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.students?.student_name || 'N/A'}</TableCell>
                  <TableCell>{submission.students?.email || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(submission.submitted_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {submission.score !== null ? (
                      <Chip
                        label={`${submission.score}/${submission.max_score}`}
                        color={getScoreColor(submission.score, submission.max_score)}
                        size="small"
                      />
                    ) : (
                      <Chip label="Not Graded" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.is_graded ? (
                      <Chip
                        icon={<CheckCircle size={16} />}
                        label="Graded"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip label="Pending" color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Eye size={16} />}
                      onClick={() => handleViewSubmission(submission)}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    {!submission.auto_graded && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit size={16} />}
                        onClick={() => handleGradeSubmission(submission)}
                        sx={{
                          bgcolor: 'rgb(147, 51, 234)',
                          '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
                        }}
                      >
                        Grade
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Submission Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Submission Details - {selectedSubmission?.students?.student_name}
        </DialogTitle>
        <DialogContent>
          {selectedSubmission?.quiz_answers?.answers && (
            <Box sx={{ mt: 2 }}>
              {selectedSubmission.quiz_answers.answers.map((answer: any, index: number) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography>Question {index + 1}</Typography>
                      {answer.is_correct !== null && (
                        answer.is_correct ? (
                          <Chip
                            icon={<CheckCircle size={16} />}
                            label="Correct"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<XCircle size={16} />}
                            label="Wrong"
                            color="error"
                            size="small"
                          />
                        )
                      )}
                      <Chip
                        label={`${answer.earned_points || 0}/${answer.points} pts`}
                        size="small"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Question:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {answer.question}
                      </Typography>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Student Answer:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 2,
                          p: 1,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                        }}
                      >
                        {answer.student_answer || 'No answer provided'}
                      </Typography>
                      
                      {answer.question_type !== 'essay' && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Correct Answer:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              p: 1,
                              bgcolor: 'success.light',
                              color: 'success.contrastText',
                              borderRadius: 1,
                            }}
                          >
                            {answer.correct_answer}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog
        open={gradeDialog}
        onClose={() => setGradeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Grade Submission</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Score"
              type="number"
              fullWidth
              value={gradeForm.score}
              onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
              helperText={`Out of ${selectedSubmission?.max_score}`}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Feedback (Optional)"
              fullWidth
              multiline
              rows={4}
              value={gradeForm.feedback}
              onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitGrade}
            sx={{
              bgcolor: 'rgb(147, 51, 234)',
              '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
            }}
          >
            Submit Grade
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
