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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { ArrowLeft, Eye, CheckCircle, XCircle } from 'lucide-react'

interface Teacher {
  id: string
  teacher_name: string
  email: string
}

interface Student {
  id: string
  student_name: string
  email: string
}

interface Submission {
  id: string
  material_id: string
  submitted_at: string
  score: number | null
  max_score: number
  is_graded: boolean
  auto_graded: boolean
  status: string
  quiz_answers: any
  class_materials?: {
    id: string
    title: string
    material_type: string
  }
}

export default function StudentSubmissionsClient({
  classId,
  studentId,
  teacher,
}: {
  classId: string
  studentId: string
  teacher: Teacher
}) {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const [viewDialog, setViewDialog] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    setMounted(true)
    fetchStudent()
    fetchSubmissions()
  }, [studentId])

  const fetchStudent = async () => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/students`)
      const data = await response.json()
      
      if (response.ok) {
        const enrollment = data.students?.find((s: any) => s.student_id === studentId)
        if (enrollment?.students) {
          setStudent(enrollment.students)
        }
      }
    } catch (err) {
      console.error('Error fetching student:', err)
    }
  }

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      // Fetch all materials in this class
      const materialsResponse = await fetch(`/api/teacher/classes/${classId}/materials`)
      const materialsData = await materialsResponse.json()
      
      if (!materialsResponse.ok) {
        setError('Failed to fetch materials')
        return
      }

      // Fetch submissions for each material
      const allSubmissions: Submission[] = []
      for (const material of materialsData.materials || []) {
        const submissionsResponse = await fetch(
          `/api/teacher/classes/${classId}/materials/${material.id}/submissions`
        )
        const submissionsData = await submissionsResponse.json()
        
        if (submissionsResponse.ok) {
          const studentSubmissions = (submissionsData.submissions || [])
            .filter((s: any) => s.student_id === studentId)
            .map((s: any) => ({
              ...s,
              class_materials: {
                id: material.id,
                title: material.title,
                material_type: material.material_type,
              }
            }))
          allSubmissions.push(...studentSubmissions)
        }
      }
      
      setSubmissions(allSubmissions)
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Submissions by {student?.student_name || 'Student'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {student?.email}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Chip label={`${submissions.length} Total Submissions`} />
            <Chip
              label={`${submissions.filter((s) => s.is_graded).length} Graded`}
              color="success"
            />
            <Chip
              label={`${submissions.filter((s) => !s.is_graded).length} Pending`}
              color="warning"
            />
          </Box>
        </CardContent>
      </Card>

      {submissions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No submissions from this student yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Submitted At</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.class_materials?.title || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={submission.class_materials?.material_type || 'N/A'}
                      size="small"
                      color={
                        submission.class_materials?.material_type === 'quiz'
                          ? 'primary'
                          : 'secondary'
                      }
                    />
                  </TableCell>
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
                    >
                      View Answers
                    </Button>
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
          {selectedSubmission?.class_materials?.title} - Answers
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
    </Box>
  )
}
