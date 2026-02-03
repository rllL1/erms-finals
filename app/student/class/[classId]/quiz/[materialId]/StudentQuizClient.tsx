'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material'
import { ArrowLeft, Clock, Send } from 'lucide-react'

interface Student {
  id: string
  student_name: string
  email: string
}

interface Question {
  id: string
  question: string
  question_type: 'multiple-choice' | 'true-false' | 'identification' | 'essay'
  options?: string[] | any
  correct_answer?: string
  points?: number
  order_number?: number
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

export default function StudentQuizClient({
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
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchMaterialAndQuiz()
  }, [materialId])

  useEffect(() => {
    if (!material || !material.time_limit) return

    const storageKey = `quiz_${materialId}_start_time`
    const storedStartTime = localStorage.getItem(storageKey)
    
    if (storedStartTime) {
      // Calculate remaining time based on stored start time
      const startTime = parseInt(storedStartTime)
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const remainingSeconds = (material.time_limit * 60) - elapsedSeconds
      
      if (remainingSeconds > 0) {
        setTimeLeft(remainingSeconds)
      } else {
        // Time's up, auto-submit
        setTimeLeft(0)
        handleSubmit()
      }
    } else {
      // First time starting the quiz
      localStorage.setItem(storageKey, Date.now().toString())
      setTimeLeft(material.time_limit * 60)
    }
  }, [material])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev ? prev - 1 : 0
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const fetchMaterialAndQuiz = async () => {
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
          await fetchQuestions(foundMaterial.quiz_id)
        } else {
          setError('Material not found')
        }
      }
    } catch (err) {
      setError('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async (quizId: string) => {
    try {
      console.log('Fetching questions for quiz ID:', quizId)
      const response = await fetch(`/api/teacher/quizzes/${quizId}`)
      console.log('Response status:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('Quiz data received:', data)

      if (response.ok && data.quiz) {
        const questions = data.quiz.quiz_questions || []
        console.log('Questions found:', questions.length)
        setQuestions(questions)
      } else {
        console.error('Failed to fetch questions. Status:', response.status, 'Data:', data)
        setError(data.error || 'Failed to load quiz questions')
      }
    } catch (err) {
      console.error('Error fetching questions:', err)
      setError('Failed to load quiz questions')
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')

      const response = await fetch('/api/student/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          material_id: materialId,
          quiz_id: material?.quiz_id,
          answers,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Clear the timer from localStorage
        localStorage.removeItem(`quiz_${materialId}_start_time`)
        
        // Redirect to results page
        if (data.submission && data.submission.id) {
          router.push(`/student/class/${classId}/quiz/${materialId}/result/${data.submission.id}`)
        } else {
          router.push(`/student/class/${classId}`)
        }
      } else {
        setError(data.error || 'Failed to submit quiz')
      }
    } catch (err) {
      setError('An error occurred while submitting')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
        <Alert severity="error">Quiz not found</Alert>
      </Box>
    )
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0)
  const answeredCount = Object.keys(answers).length
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {material.title}
              </Typography>
              {material.description && (
                <Typography variant="body2" color="text.secondary">
                  {material.description}
                </Typography>
              )}
            </Box>
            {timeLeft !== null && (
              <Chip
                icon={<Clock size={16} />}
                label={formatTime(timeLeft)}
                color={timeLeft < 300 ? 'error' : 'primary'}
                sx={{ fontSize: '1rem', py: 2.5 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`${questions.length} Questions`} />
            <Chip label={`${totalPoints} Points`} />
            <Chip
              label={`${answeredCount}/${questions.length} Answered`}
              color={answeredCount === questions.length ? 'success' : 'default'}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Progress
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
          </Box>
        </CardContent>
      </Card>

      {questions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No questions available for this quiz
            </Typography>
          </CardContent>
        </Card>
      ) : (
        questions.map((question, index) => (
          <Card key={question.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Question {index + 1}
                </Typography>
                <Chip label={`${question.points || 1} pts`} size="small" />
              </Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {question.question}
              </Typography>

              {question.question_type === 'multiple-choice' && question.options && (
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  >
                    {(Array.isArray(question.options) ? question.options : 
                      typeof question.options === 'string' ? JSON.parse(question.options) : 
                      []).map((option, optIndex) => (
                      <FormControlLabel
                        key={optIndex}
                        value={option}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}

              {question.question_type === 'true-false' && (
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  >
                    <FormControlLabel value="True" control={<Radio />} label="True" />
                    <FormControlLabel value="False" control={<Radio />} label="False" />
                  </RadioGroup>
                </FormControl>
              )}

              {(question.question_type === 'identification') && (
                <TextField
                  fullWidth
                  placeholder="Type your answer here..."
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Make sure to answer all questions before submitting
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={submitting ? <CircularProgress size={20} /> : <Send size={20} />}
          onClick={handleSubmit}
          disabled={submitting || answeredCount === 0}
          sx={{
            bgcolor: 'rgb(147, 51, 234)',
            '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
            '&:disabled': { bgcolor: 'grey.300' },
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </Box>
    </Box>
  )
}
