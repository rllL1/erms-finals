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
  TextField,
  InputAdornment,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { ArrowLeft, Eye, CheckCircle, XCircle, Save } from 'lucide-react'

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
  assignment_response?: string
  assignment_file_url?: string
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
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const [viewDialog, setViewDialog] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeScore, setGradeScore] = useState('')
  const [maxScore, setMaxScore] = useState('')
  const [grading, setGrading] = useState(false)

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
    console.log('Viewing submission:', submission)
    console.log('Quiz answers:', submission.quiz_answers)
    console.log('Assignment response:', submission.assignment_response)
    setSelectedSubmission(submission)
    setGradeScore(submission.score?.toString() || '')
    setMaxScore(submission.max_score?.toString() || '100')
    setViewDialog(true)
  }

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return

    const score = parseFloat(gradeScore)
    const maxScoreValue = parseFloat(maxScore)
    
    if (isNaN(score) || score < 0) {
      setError('Score must be a valid number and greater than or equal to 0')
      return
    }

    if (isNaN(maxScoreValue) || maxScoreValue <= 0) {
      setError('Max score must be a valid number and greater than 0')
      return
    }

    if (score > maxScoreValue) {
      setError(`Score cannot be greater than max score (${maxScoreValue})`)
      return
    }

    try {
      setGrading(true)
      setError('')
      setSuccess('')

      const response = await fetch(
        `/api/teacher/classes/${classId}/materials/${selectedSubmission.material_id}/submissions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: selectedSubmission.id,
            score,
            max_score: maxScoreValue,
            teacher_id: teacher.id,
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setSuccess('Submission graded successfully!')
        fetchSubmissions()
        setTimeout(() => {
          setViewDialog(false)
          setSuccess('')
        }, 1500)
      } else {
        setError(data.error || 'Failed to grade submission')
      }
    } catch (err) {
      setError('An error occurred while grading')
    } finally {
      setGrading(false)
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
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Score Input for Assignments */}
          {selectedSubmission?.class_materials?.material_type === 'assignment' && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                Grade Assignment
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Score"
                  type="number"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  inputProps={{
                    min: 0,
                    step: 0.5,
                  }}
                  sx={{ width: 150 }}
                  size="small"
                />
                <TextField
                  label="Max Score"
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  inputProps={{
                    min: 1,
                    step: 1,
                  }}
                  sx={{ width: 150 }}
                  size="small"
                />
                <Button
                  variant="contained"
                  startIcon={<Save size={16} />}
                  onClick={handleGradeSubmission}
                  disabled={grading || !gradeScore || !maxScore}
                  sx={{ 
                    bgcolor: '#16a34a',
                    '&:hover': { bgcolor: '#15803d' }
                  }}
                >
                  {grading ? 'Saving...' : 'Save Score'}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Current Status: {selectedSubmission.is_graded ? (
                  <Chip label="Graded" color="success" size="small" sx={{ ml: 1 }} />
                ) : (
                  <Chip label="Pending" color="warning" size="small" sx={{ ml: 1 }} />
                )}
                {selectedSubmission.score !== null && selectedSubmission.max_score !== null && (
                  <span style={{ marginLeft: 8 }}>
                    Current Score: {selectedSubmission.score}/{selectedSubmission.max_score}
                  </span>
                )}
              </Typography>
            </Box>
          )}

          {/* Display Assignment Response (Text-based) */}
          {selectedSubmission?.class_materials?.material_type === 'assignment' && 
           selectedSubmission?.assignment_response && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Student Answer
              </Typography>
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'grey.300',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.8,
                  }}
                >
                  {selectedSubmission.assignment_response}
                </Typography>
              </Box>
              {selectedSubmission.assignment_file_url && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    Attached File:
                  </Typography>
                  <Button
                    variant="outlined"
                    href={selectedSubmission.assignment_file_url}
                    target="_blank"
                    sx={{ mt: 1 }}
                  >
                    Download Attachment
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Display Quiz/Assignment Answers (Question-based) */}
          {selectedSubmission?.quiz_answers?.answers && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                {selectedSubmission?.class_materials?.material_type === 'assignment' 
                  ? 'Student Submission' 
                  : 'Quiz Answers'}
              </Typography>
              {selectedSubmission.quiz_answers.answers.map((answer: any, index: number) => (
                <Accordion key={index} defaultExpanded={selectedSubmission?.class_materials?.material_type === 'assignment'}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography fontWeight={500}>
                        {selectedSubmission?.class_materials?.material_type === 'assignment' 
                          ? `Question ${index + 1}` 
                          : `Question ${index + 1}`}
                      </Typography>
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
                      {answer.points && (
                        <Chip
                          label={`${answer.earned_points || 0}/${answer.points} pts`}
                          size="small"
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                        Question:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                        {answer.question}
                      </Typography>
                      
                      <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                        Student Answer:
                      </Typography>
                      <Box
                        sx={{
                          mb: 2,
                          p: 2,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.300',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-wrap' }}
                        >
                          {answer.student_answer || 'No answer provided'}
                        </Typography>
                      </Box>
                      
                      {answer.question_type !== 'essay' && answer.correct_answer && (
                        <>
                          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            Correct Answer:
                          </Typography>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: 'success.50',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'success.200',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ 
                                color: 'success.dark',
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {answer.correct_answer}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* No answers available */}
          {!selectedSubmission?.quiz_answers?.answers && 
           !selectedSubmission?.assignment_response &&
           selectedSubmission?.class_materials?.material_type === 'assignment' && (
            <Box sx={{ mt: 2, p: 3, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                No Text Response
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submitted on: {selectedSubmission?.submitted_at ? new Date(selectedSubmission.submitted_at).toLocaleString() : 'N/A'}
              </Typography>
              {selectedSubmission.assignment_file_url ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    This student submitted a file attachment:
                  </Typography>
                  <Button
                    variant="outlined"
                    href={selectedSubmission.assignment_file_url}
                    target="_blank"
                  >
                    Download Attachment
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No detailed question answers available. This may be a file-based submission.
                </Typography>
              )}
            </Box>
          )}

          {!selectedSubmission?.quiz_answers?.answers && selectedSubmission?.class_materials?.material_type !== 'assignment' && (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No detailed answers available for this submission
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
