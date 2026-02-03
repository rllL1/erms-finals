'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
} from '@mui/material'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

interface Student {
  id: string
  student_name: string
  email: string
}

interface QuestionAnswer {
  question: string
  question_type: string
  student_answer: string
  correct_answer: string
  is_correct: boolean | null
  earned_points: number
  points: number
}

interface Submission {
  id: string
  material_id: string
  student_id: string
  score: number
  max_score: number
  is_graded: boolean
  submitted_at: string
  quiz_answers: {
    answers: QuestionAnswer[]
  }
}

interface Material {
  id: string
  title: string
  description?: string
  material_type: string
}

export default function StudentResultClient({
  classId,
  materialId,
  submissionId,
  student,
}: {
  classId: string
  materialId: string
  submissionId: string
  student: Student
}) {
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubmissionResult()
  }, [submissionId])

  const fetchSubmissionResult = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch submission
      const response = await fetch(`/api/student/submissions/${submissionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch submission')
      }

      const data = await response.json()
      console.log('Submission data:', data.submission)
      console.log('Quiz answers:', data.submission?.quiz_answers)
      setSubmission(data.submission)
      setMaterial(data.material)
    } catch (err: any) {
      console.error('Error fetching submission:', err)
      setError(err.message || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const getScorePercentage = () => {
    if (!submission || submission.score === null || submission.max_score === null) return 0
    return Math.round((submission.score / submission.max_score) * 100)
  }

  const getScoreColor = () => {
    const percentage = getScorePercentage()
    if (percentage >= 80) return 'success'
    if (percentage >= 60) return 'warning'
    return 'error'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </Box>
    )
  }

  if (!submission || !material) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Submission not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={() => router.push(`/student/class/${classId}`)}
          sx={{ mb: 2 }}
        >
          Back to Class
        </Button>
        
        <Typography variant="h4" gutterBottom>
          {material.title} - Results
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Submitted on {new Date(submission.submitted_at).toLocaleString()}
        </Typography>
      </Box>

      {/* Score Card */}
      <Card sx={{ mb: 3, bgcolor: getScoreColor() === 'success' ? 'success.light' : getScoreColor() === 'warning' ? 'warning.light' : 'error.light' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Your Score
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h3">
              {submission.score !== null ? `${submission.score}/${submission.max_score}` : 'Pending'}
            </Typography>
            {submission.score !== null && (
              <Chip
                label={`${getScorePercentage()}%`}
                color={getScoreColor()}
                size="large"
              />
            )}
          </Box>
          {!submission.is_graded && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Some questions are pending manual grading by your teacher.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Questions and Answers */}
      {submission.quiz_answers && submission.quiz_answers.answers && submission.quiz_answers.answers.length > 0 ? (
        <>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Review Your Answers
          </Typography>

          {submission.quiz_answers.answers.map((answer, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">
                Question {index + 1}
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
              
              <Chip
                label={`${answer.earned_points}/${answer.points} pts`}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* Question Text */}
            <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {answer.question}
              </Typography>
            </Paper>

            {/* Student Answer */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Your Answer:
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: answer.is_correct === true ? 'success.light' : answer.is_correct === false ? 'error.light' : 'grey.100',
                  border: 1,
                  borderColor: answer.is_correct === true ? 'success.main' : answer.is_correct === false ? 'error.main' : 'grey.300',
                }}
              >
                <Typography variant="body1">
                  {answer.student_answer || 'No answer provided'}
                </Typography>
              </Paper>
            </Box>

            {/* Correct Answer (for non-essay questions) */}
            {answer.question_type !== 'essay' && answer.correct_answer && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Correct Answer:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'success.light',
                    border: 1,
                    borderColor: 'success.main',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {answer.correct_answer}
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* For essay questions pending grading */}
            {answer.question_type === 'essay' && answer.is_correct === null && (
              <Alert severity="info">
                This essay question is pending manual grading by your teacher.
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
        </>
      ) : (
        /* Assignment Submission */
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Submission
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {submission.assignment_response || 'No response provided'}
              </Typography>
            </Paper>
            {!submission.is_graded && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Your assignment is pending manual grading by your teacher.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => router.push(`/student/class/${classId}`)}
        >
          Back to Class
        </Button>
      </Box>
    </Box>
  )
}
