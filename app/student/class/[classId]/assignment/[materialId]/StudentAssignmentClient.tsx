'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material'
import { ArrowLeft, Clock, Send, FileText } from 'lucide-react'

interface Student {
  id: string
  student_name: string
  email: string
}

interface Quiz {
  id: string
  title: string
  type: string
  quiz_type?: string
}

interface Material {
  id: string
  title: string
  description?: string
  time_limit?: number
  due_date?: string
  quiz_id: string
  quizzes?: Quiz
}

export default function StudentAssignmentClient({
  classId,
  materialId,
  student,
}: {
  classId: string
  materialId: string
  student: Student
}) {
  const router = useRouter()
  const [material, setMaterial] = useState<Material | null>(null)
  const [assignment, setAssignment] = useState<any>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchMaterialAndAssignment()
  }, [materialId])

  const fetchMaterialAndAssignment = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/student/classes/${classId}/materials?studentId=${student.id}`
      )
      const data = await response.json()

      if (response.ok) {
        const foundMaterial = data.materials?.find((m: Material) => m.id === materialId)
        if (foundMaterial) {
          setMaterial(foundMaterial)
          await fetchAssignmentDetails(foundMaterial.quiz_id)
        } else {
          setError('Assignment not found')
        }
      }
    } catch (err) {
      setError('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignmentDetails = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`)
      const data = await response.json()

      if (response.ok && data.assignment) {
        setAssignment(data.assignment)
      }
    } catch (err) {
      console.error('Error fetching assignment:', err)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')

      if (!answer.trim()) {
        setError('Please provide an answer before submitting')
        return
      }

      const response = await fetch('/api/student/submit-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          material_id: materialId,
          assignment_id: material?.quiz_id,
          answer_text: answer,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to results page
        if (data.submission && data.submission.id) {
          router.push(`/student/class/${classId}/assignment/${materialId}/result/${data.submission.id}`)
        } else {
          router.push(`/student/class/${classId}`)
        }
      } else {
        setError(data.error || 'Failed to submit assignment')
      }
    } catch (err) {
      setError('An error occurred while submitting')
    } finally {
      setSubmitting(false)
    }
  }

  const isDueSoon = () => {
    if (!material?.due_date) return false
    const now = new Date()
    const due = new Date(material.due_date)
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilDue > 0 && hoursUntilDue <= 24
  }

  const isOverdue = () => {
    if (!material?.due_date) return false
    return new Date(material.due_date) < new Date()
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

  if (!material) {
    return (
      <Box sx={{ maxWidth: '1536px', mx: 'auto', mt: 4, px: 2 }}>
        <Alert severity="error">Assignment not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: '1024px', mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      <Button
        startIcon={<ArrowLeft />}
        onClick={() => router.push(`/student/class/${classId}`)}
        sx={{ mb: 2 }}
        disabled={submitting}
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
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <FileText size={24} />
            <Typography variant="h4">
              {material.title}
            </Typography>
          </Box>

          {material.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {material.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {material.due_date && (
              <Chip
                icon={<Clock size={16} />}
                label={`Due: ${new Date(material.due_date).toLocaleString()}`}
                color={isOverdue() ? 'error' : isDueSoon() ? 'warning' : 'default'}
              />
            )}
            {material.time_limit && (
              <Chip label={`${material.time_limit} minutes`} />
            )}
          </Box>

          {isOverdue() && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This assignment is overdue. Late submissions may receive reduced points.
            </Alert>
          )}

          {isDueSoon() && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This assignment is due soon!
            </Alert>
          )}
        </CardContent>
      </Card>

      {assignment && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assignment Instructions
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {assignment.instructions || 'No specific instructions provided.'}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Answer
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={12}
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="caption" color="text.secondary">
            {answer.length} characters
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={submitting ? <CircularProgress size={20} /> : <Send size={20} />}
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          sx={{
            bgcolor: 'rgb(147, 51, 234)',
            '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
            '&:disabled': { bgcolor: 'grey.300' },
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Assignment'}
        </Button>
      </Box>
    </Box>
  )
}
