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
  Tooltip,
  IconButton,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { ArrowLeft, Eye, CheckCircle, XCircle, Edit, Download, FileText } from 'lucide-react'
import NotificationModal, { type ModalSeverity } from '@/app/components/NotificationModal'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quiz_answers: any
  assignment_response?: string
  assignment_file_url?: string
  feedback?: string | null
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
  const [mounted, setMounted] = useState(false)

  // Notification modal
  const [notification, setNotification] = useState<{ open: boolean; severity: ModalSeverity; message: string; title?: string }>({
    open: false, severity: 'success', message: '', title: undefined
  })
  
  const [viewDialog, setViewDialog] = useState(false)
  const [gradeDialog, setGradeDialog] = useState(false)
  const [previewDialog, setPreviewDialog] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewFileName, setPreviewFileName] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeForm, setGradeForm] = useState({ score: '', max_score: '', feedback: '' })
  const [gradeErrors, setGradeErrors] = useState({ score: '', max_score: '' })

  useEffect(() => {
    setMounted(true)
    fetchMaterial()
    fetchSubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId])

  const fetchMaterial = async () => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/materials`)
      const data = await response.json()
      
      if (response.ok) {
        const found = data.materials?.find((m: Material) => m.id === materialId)
        if (found) setMaterial(found)
      }
    } catch (_err) {
      console.error('Error fetching material:', _err)
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
      max_score: submission.max_score?.toString() || '100',
      feedback: submission.feedback || '',
    })
    setGradeErrors({ score: '', max_score: '' })
    setGradeDialog(true)
  }

  const validateGradeForm = (): boolean => {
    const errors = { score: '', max_score: '' }
    let isValid = true

    // Score validation
    if (!gradeForm.score.trim()) {
      errors.score = 'Score is required'
      isValid = false
    } else if (isNaN(Number(gradeForm.score))) {
      errors.score = 'Score must be a number'
      isValid = false
    } else if (Number(gradeForm.score) < 0) {
      errors.score = 'Score cannot be negative'
      isValid = false
    }

    // Max Score validation
    if (!gradeForm.max_score.trim()) {
      errors.max_score = 'Max score is required'
      isValid = false
    } else if (isNaN(Number(gradeForm.max_score))) {
      errors.max_score = 'Max score must be a number'
      isValid = false
    } else if (Number(gradeForm.max_score) <= 0) {
      errors.max_score = 'Max score must be greater than 0'
      isValid = false
    }

    // Score cannot exceed max score
    if (isValid && Number(gradeForm.score) > Number(gradeForm.max_score)) {
      errors.score = 'Score cannot exceed max score'
      isValid = false
    }

    setGradeErrors(errors)
    return isValid
  }

  const submitGrade = async () => {
    if (!selectedSubmission) return
    if (!validateGradeForm()) return

    try {
      const response = await fetch(
        `/api/teacher/classes/${classId}/materials/${materialId}/submissions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: selectedSubmission.id,
            score: parseFloat(gradeForm.score),
            max_score: parseFloat(gradeForm.max_score),
            teacher_id: teacher.id,
            feedback: gradeForm.feedback.trim() || null,
          }),
        }
      )

      if (response.ok) {
        setGradeDialog(false)
        setNotification({
          open: true,
          severity: 'success',
          title: 'Score Updated',
          message: 'Student score successfully updated.',
        })
        fetchSubmissions()
      } else {
        const data = await response.json()
        setNotification({
          open: true,
          severity: 'error',
          message: data.error || 'Failed to submit grade',
        })
      }
    } catch (_err) {
      setNotification({
        open: true,
        severity: 'error',
        message: 'An error occurred while submitting the grade',
      })
    }
  }

  const handlePreviewFile = (url: string, fileName: string) => {
    setPreviewUrl(url)
    setPreviewFileName(fileName)
    setPreviewDialog(true)
  }

  const getFileNameFromUrl = (url: string) => {
    try {
      const path = new URL(url).pathname
      const parts = path.split('/')
      return parts[parts.length - 1] || 'file'
    } catch {
      return 'file'
    }
  }

  const isPdf = (url: string) => {
    return url?.toLowerCase().includes('.pdf')
  }

  const getScoreColor = (score: number | null, maxScore: number) => {
    if (score === null) return 'default'
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return 'success'
    if (percentage >= 75) return 'primary'
    if (percentage >= 60) return 'warning'
    return 'error'
  }

  const getAnswerStats = (submission: Submission) => {
    const answers = submission.quiz_answers?.answers
    if (!Array.isArray(answers)) return { correct: 0, wrong: 0, pending: 0, total: 0 }
    let correct = 0
    let wrong = 0
    let pending = 0
    for (const a of answers) {
      if (a.is_correct === true) correct++
      else if (a.is_correct === false) wrong++
      else pending++
    }
    return { correct, wrong, pending, total: answers.length }
  }

  const summaryStats = (() => {
    if (submissions.length === 0) return null
    const totalStudents = submissions.length
    const gradedCount = submissions.filter((s) => s.is_graded).length
    const pendingCount = totalStudents - gradedCount
    const scoredSubmissions = submissions.filter((s) => s.score !== null)
    const avgScore = scoredSubmissions.length > 0
      ? (scoredSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / scoredSubmissions.length).toFixed(1)
      : 'N/A'
    const avgMax = scoredSubmissions.length > 0
      ? (scoredSubmissions.reduce((sum, s) => sum + s.max_score, 0) / scoredSubmissions.length).toFixed(1)
      : 'N/A'
    const highestScore = scoredSubmissions.length > 0
      ? Math.max(...scoredSubmissions.map((s) => s.score || 0))
      : 0
    const lowestScore = scoredSubmissions.length > 0
      ? Math.min(...scoredSubmissions.map((s) => s.score || 0))
      : 0

    let totalCorrect = 0
    let totalWrong = 0
    let totalPendingAnswers = 0
    for (const s of submissions) {
      const stats = getAnswerStats(s)
      totalCorrect += stats.correct
      totalWrong += stats.wrong
      totalPendingAnswers += stats.pending
    }

    return {
      totalStudents,
      gradedCount,
      pendingCount,
      avgScore,
      avgMax,
      highestScore,
      lowestScore,
      totalCorrect,
      totalWrong,
      totalPendingAnswers,
    }
  })()

  const isAssignment = material?.material_type === 'assignment'

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

      {/* Summary Statistics Card */}
      {summaryStats && (
        <Card sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Score Summary
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h5" color="primary.main">{summaryStats.totalStudents}</Typography>
                <Typography variant="caption" color="text.secondary">Total Submissions</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h5" color="success.main">{summaryStats.gradedCount}</Typography>
                <Typography variant="caption" color="text.secondary">Graded</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h5" color="warning.main">{summaryStats.pendingCount}</Typography>
                <Typography variant="caption" color="text.secondary">Pending</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h5" color="info.main">{summaryStats.avgScore}/{summaryStats.avgMax}</Typography>
                <Typography variant="caption" color="text.secondary">Avg Score</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h5">
                  <Box component="span" sx={{ color: 'success.main' }}>{summaryStats.highestScore}</Box>
                  {' / '}
                  <Box component="span" sx={{ color: 'error.main' }}>{summaryStats.lowestScore}</Box>
                </Typography>
                <Typography variant="caption" color="text.secondary">Highest / Lowest</Typography>
              </Box>
              {!isAssignment && (
                <>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="h5" color="success.main">{summaryStats.totalCorrect}</Typography>
                    <Typography variant="caption" color="text.secondary">Total Correct</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'error.50', borderRadius: 1 }}>
                    <Typography variant="h5" color="error.main">{summaryStats.totalWrong}</Typography>
                    <Typography variant="caption" color="text.secondary">Total Wrong</Typography>
                  </Box>
                  {summaryStats.totalPendingAnswers > 0 && (
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'warning.50', borderRadius: 1 }}>
                      <Typography variant="h5" color="warning.main">{summaryStats.totalPendingAnswers}</Typography>
                      <Typography variant="caption" color="text.secondary">Pending Grading</Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

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
                {isAssignment && <TableCell>Uploaded File</TableCell>}
                <TableCell>Submission Date</TableCell>
                <TableCell>Score Status</TableCell>
                {!isAssignment && <TableCell>Correct</TableCell>}
                {!isAssignment && <TableCell>Wrong</TableCell>}
                <TableCell>Status</TableCell>
                <TableCell>Feedback</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => {
                const stats = getAnswerStats(submission)
                const fileName = submission.assignment_file_url
                  ? getFileNameFromUrl(submission.assignment_file_url)
                  : null
                return (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {submission.students?.student_name || 'N/A'}
                    </Typography>
                  </TableCell>
                  {isAssignment && (
                    <TableCell>
                      {submission.assignment_file_url ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FileText size={16} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {fileName}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Text only</Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </Typography>
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
                  {!isAssignment && (
                    <TableCell>
                      <Chip label={stats.correct} color="success" size="small" variant="outlined" />
                    </TableCell>
                  )}
                  {!isAssignment && (
                    <TableCell>
                      <Chip label={stats.wrong} color="error" size="small" variant="outlined" />
                    </TableCell>
                  )}
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
                  <TableCell>
                    {submission.feedback ? (
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {submission.feedback}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      <Tooltip title="View Submission">
                        <IconButton
                          size="small"
                          onClick={() => handleViewSubmission(submission)}
                          color="primary"
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      {isAssignment && submission.assignment_file_url && (
                        <>
                          {isPdf(submission.assignment_file_url) && (
                            <Tooltip title="Preview PDF">
                              <IconButton
                                size="small"
                                onClick={() => handlePreviewFile(
                                  submission.assignment_file_url!,
                                  submission.students?.student_name || 'Student'
                                )}
                                sx={{ color: 'rgb(147, 51, 234)' }}
                              >
                                <FileText size={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Download File">
                            <IconButton
                              size="small"
                              component="a"
                              href={submission.assignment_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="info"
                            >
                              <Download size={18} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit size={16} />}
                        onClick={() => handleGradeSubmission(submission)}
                        sx={{
                          bgcolor: 'rgb(147, 51, 234)',
                          '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
                          ml: 0.5,
                        }}
                      >
                        Grade
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
                )
              })}
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
          {/* Show assignment response text */}
          {isAssignment && selectedSubmission?.assignment_response && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Student&apos;s Written Response:</Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', whiteSpace: 'pre-wrap' }}>
                <Typography variant="body2">{selectedSubmission.assignment_response}</Typography>
              </Paper>
            </Box>
          )}

          {/* Show uploaded file for assignments */}
          {isAssignment && selectedSubmission?.assignment_file_url && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Uploaded Answer File:</Typography>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <FileText size={24} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {getFileNameFromUrl(selectedSubmission.assignment_file_url)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {isPdf(selectedSubmission.assignment_file_url) && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Eye size={16} />}
                        onClick={() => handlePreviewFile(
                          selectedSubmission.assignment_file_url!,
                          selectedSubmission.students?.student_name || 'Student'
                        )}
                      >
                        Preview
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Download size={16} />}
                      component="a"
                      href={selectedSubmission.assignment_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Box>
          )}

          {/* Show quiz answers */}
          {!isAssignment && selectedSubmission?.quiz_answers?.answers && (
            <Box sx={{ mt: 2 }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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

          {/* No content fallback */}
          {isAssignment && !selectedSubmission?.assignment_response && !selectedSubmission?.assignment_file_url && (
            <Box sx={{ mt: 2, textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No submission content available</Typography>
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
        <DialogTitle>
          Grade Submission
          {selectedSubmission?.students?.student_name && (
            <Typography variant="body2" color="text.secondary">
              Student: {selectedSubmission.students.student_name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Score"
              type="number"
              fullWidth
              value={gradeForm.score}
              onChange={(e) => {
                setGradeForm({ ...gradeForm, score: e.target.value })
                if (gradeErrors.score) setGradeErrors({ ...gradeErrors, score: '' })
              }}
              error={!!gradeErrors.score}
              helperText={gradeErrors.score || 'Enter the student\'s score'}
              sx={{ mb: 2 }}
              inputProps={{ min: 0, step: 'any' }}
              required
            />
            <TextField
              label="Max Score"
              type="number"
              fullWidth
              value={gradeForm.max_score}
              onChange={(e) => {
                setGradeForm({ ...gradeForm, max_score: e.target.value })
                if (gradeErrors.max_score) setGradeErrors({ ...gradeErrors, max_score: '' })
              }}
              error={!!gradeErrors.max_score}
              helperText={gradeErrors.max_score || 'Maximum possible score'}
              sx={{ mb: 2 }}
              inputProps={{ min: 1, step: 'any' }}
              required
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
            disabled={!gradeForm.score.trim() || !gradeForm.max_score.trim()}
            sx={{
              bgcolor: 'rgb(147, 51, 234)',
              '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
            }}
          >
            Submit Grade
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Preview - {previewFileName}
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '75vh' }}>
          <iframe
            src={previewUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="PDF Preview"
          />
        </DialogContent>
        <DialogActions>
          <Button
            component="a"
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Download size={16} />}
          >
            Download
          </Button>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Modal */}
      <NotificationModal
        open={notification.open}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        title={notification.title}
        message={notification.message}
        severity={notification.severity}
      />
    </Box>
  )
}
