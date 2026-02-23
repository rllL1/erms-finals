'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Snackbar,
} from '@mui/material'
import { ArrowLeft, Clock, Send, Save } from 'lucide-react'

interface Student {
  id: string
  student_name: string
  email: string
}

interface Question {
  id: string
  question: string
  question_type: 'multiple-choice' | 'true-false' | 'identification' | 'essay'
  options?: string[] | Record<string, unknown>
  correct_answer?: string
  points?: number
  order_number?: number
  image_url?: string
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
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [answersLoaded, setAnswersLoaded] = useState(false)

  // Refs for debounced DB save
  const dbSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const latestAnswersRef = useRef<Record<string, string>>({})
  const materialRef = useRef<Material | null>(null)
  const submitGuardRef = useRef(false)

  // Keep refs in sync
  useEffect(() => {
    latestAnswersRef.current = answers
  }, [answers])

  useEffect(() => {
    materialRef.current = material
  }, [material])

  // --- Save progress to database (debounced) ---
  const saveProgressToDB = useCallback(async (answersToSave: Record<string, string>) => {
    const mat = materialRef.current
    if (!mat) return

    try {
      setSaveStatus('saving')

      const startTimeStr = localStorage.getItem(`quiz_${materialId}_start_time`)

      await fetch('/api/student/quiz-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          materialId,
          quizId: mat.quiz_id,
          answers: answersToSave,
          startTime: startTimeStr ? parseInt(startTimeStr) : Date.now(),
        }),
      })

      setSaveStatus('saved')
      // Reset save indicator after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to save progress to DB:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [materialId, student.id])

  // Debounced DB save - triggers 2 seconds after last answer change
  const debouncedSaveToDB = useCallback((newAnswers: Record<string, string>) => {
    if (dbSaveTimeoutRef.current) {
      clearTimeout(dbSaveTimeoutRef.current)
    }
    dbSaveTimeoutRef.current = setTimeout(() => {
      saveProgressToDB(newAnswers)
    }, 2000)
  }, [saveProgressToDB])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (dbSaveTimeoutRef.current) {
        clearTimeout(dbSaveTimeoutRef.current)
      }
    }
  }, [])

  // --- Fetch questions ---
  const fetchQuestions = useCallback(async (quizId: string) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`)
      const data = await response.json()

      if (response.ok && data.quiz) {
        const fetchedQuestions = data.quiz.quiz_questions || []
        setQuestions(fetchedQuestions)
      } else {
        setError(data.error || 'Failed to load quiz questions')
      }
    } catch {
      setError('Failed to load quiz questions')
    }
  }, [])

  // --- Fetch material and quiz ---
  const fetchMaterialAndQuiz = useCallback(async () => {
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
    } catch {
      setError('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }, [classId, student.id, materialId, fetchQuestions])

  // --- Submit quiz ---
  const handleSubmit = useCallback(async () => {
    // Prevent double-submission
    if (submitGuardRef.current || submitting) return
    submitGuardRef.current = true

    try {
      setSubmitting(true)
      setError('')

      // Cancel any pending DB save
      if (dbSaveTimeoutRef.current) {
        clearTimeout(dbSaveTimeoutRef.current)
      }

      const currentAnswers = latestAnswersRef.current

      const response = await fetch('/api/student/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          material_id: materialId,
          quiz_id: materialRef.current?.quiz_id,
          answers: currentAnswers,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Clear localStorage
        localStorage.removeItem(`quiz_${materialId}_start_time`)
        localStorage.removeItem(`quiz_${materialId}_answers`)

        // Clear DB draft (fire-and-forget)
        fetch(`/api/student/quiz-progress?studentId=${student.id}&materialId=${materialId}`, {
          method: 'DELETE',
        }).catch(() => {})

        // Redirect to results page
        if (data.submission && data.submission.id) {
          router.push(`/student/class/${classId}/quiz/${materialId}/result/${data.submission.id}`)
        } else {
          router.push(`/student/class/${classId}`)
        }
      } else if (response.status === 409) {
        // Already submitted
        setAlreadySubmitted(true)
        setError('This quiz has already been submitted.')
        localStorage.removeItem(`quiz_${materialId}_start_time`)
        localStorage.removeItem(`quiz_${materialId}_answers`)
      } else {
        setError(data.error || 'Failed to submit quiz')
        submitGuardRef.current = false
      }
    } catch {
      setError('An error occurred while submitting')
      submitGuardRef.current = false
    } finally {
      setSubmitting(false)
    }
  }, [student.id, materialId, router, classId, submitting])

  // --- Mount: fetch material + load saved progress ---
  useEffect(() => {
    setMounted(true)
    fetchMaterialAndQuiz()
  }, [fetchMaterialAndQuiz])

  // Load saved answers from localStorage AND DB on mount
  useEffect(() => {
    let cancelled = false

    const loadSavedProgress = async () => {
      // Step 1: Try localStorage first (instant)
      let localAnswers: Record<string, string> | null = null
      const savedAnswers = localStorage.getItem(`quiz_${materialId}_answers`)
      if (savedAnswers) {
        try {
          localAnswers = JSON.parse(savedAnswers)
        } catch {
          // Invalid saved data, ignore it
        }
      }

      // Step 2: Check DB for saved progress + submission status
      try {
        const response = await fetch(
          `/api/student/quiz-progress?studentId=${student.id}&materialId=${materialId}`
        )
        const data = await response.json()

        if (cancelled) return

        if (data.alreadySubmitted) {
          setAlreadySubmitted(true)
          setExistingSubmissionId(data.submissionId || null)
          setAnswersLoaded(true)
          return
        }

        if (data.draft) {
          const dbAnswers = data.draft.answers || {}
          const dbStartTime = data.draft.start_time

          // Use whichever has more answers (localStorage or DB)
          const localCount = localAnswers ? Object.keys(localAnswers).length : 0
          const dbCount = Object.keys(dbAnswers).length

          if (dbCount > 0 && dbCount >= localCount) {
            // DB has equal or more answers — use DB version
            setAnswers(dbAnswers)
            localStorage.setItem(`quiz_${materialId}_answers`, JSON.stringify(dbAnswers))
          } else if (localAnswers && localCount > 0) {
            // localStorage has more answers — use localStorage
            setAnswers(localAnswers)
          }

          // Restore start time from DB if not in localStorage
          if (dbStartTime && !localStorage.getItem(`quiz_${materialId}_start_time`)) {
            const dbStartMs = new Date(dbStartTime).getTime()
            localStorage.setItem(`quiz_${materialId}_start_time`, dbStartMs.toString())
          }
        } else if (localAnswers && Object.keys(localAnswers).length > 0) {
          // No DB draft, but localStorage has answers
          setAnswers(localAnswers)
        }
      } catch (err) {
        console.error('Failed to load progress from DB:', err)
        // Fall back to localStorage only
        if (localAnswers && Object.keys(localAnswers).length > 0) {
          setAnswers(localAnswers)
        }
      }

      if (!cancelled) {
        setAnswersLoaded(true)
      }
    }

    loadSavedProgress()

    return () => {
      cancelled = true
    }
  }, [materialId, student.id])

  // --- Timer setup ---
  useEffect(() => {
    if (!material || !material.time_limit || !answersLoaded) return

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
  }, [material, materialId, handleSubmit, answersLoaded])

  // --- Timer countdown ---
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
  }, [timeLeft, handleSubmit])

  // --- Save on beforeunload (flush pending drafts) ---
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Synchronously save to localStorage (guaranteed)
      localStorage.setItem(
        `quiz_${materialId}_answers`,
        JSON.stringify(latestAnswersRef.current)
      )
      // Also attempt to save to DB via sendBeacon
      const mat = materialRef.current
      if (mat && navigator.sendBeacon) {
        const startTimeStr = localStorage.getItem(`quiz_${materialId}_start_time`)
        const payload = JSON.stringify({
          studentId: student.id,
          materialId,
          quizId: mat.quiz_id,
          answers: latestAnswersRef.current,
          startTime: startTimeStr ? parseInt(startTimeStr) : Date.now(),
        })
        navigator.sendBeacon('/api/student/quiz-progress', new Blob([payload], { type: 'application/json' }))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [materialId, student.id])

  // --- Answer change handler ---
  const handleAnswerChange = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer }
    setAnswers(newAnswers)

    // Immediately save to localStorage
    localStorage.setItem(`quiz_${materialId}_answers`, JSON.stringify(newAnswers))

    // Debounced save to database
    debouncedSaveToDB(newAnswers)
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

  // Already submitted — show message and link to results
  if (alreadySubmitted) {
    return (
      <Box sx={{ maxWidth: '1024px', mx: 'auto', mt: 4, px: 2 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => router.push(`/student/class/${classId}`)}
          sx={{ mb: 2 }}
        >
          Back to Class
        </Button>
        <Alert severity="info" sx={{ mb: 2 }}>
          You have already submitted this quiz.
        </Alert>
        {existingSubmissionId && (
          <Button
            variant="contained"
            onClick={() =>
              router.push(
                `/student/class/${classId}/quiz/${materialId}/result/${existingSubmissionId}`
              )
            }
            sx={{
              bgcolor: 'rgb(147, 51, 234)',
              '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
            }}
          >
            View Results
          </Button>
        )}
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {saveStatus === 'saving' && (
                <Chip
                  icon={<Save size={14} />}
                  label="Saving..."
                  size="small"
                  color="default"
                  variant="outlined"
                />
              )}
              {saveStatus === 'saved' && (
                <Chip
                  icon={<Save size={14} />}
                  label="Saved"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {timeLeft !== null && (
                <Chip
                  icon={<Clock size={16} />}
                  label={formatTime(timeLeft)}
                  color={timeLeft < 300 ? 'error' : 'primary'}
                  sx={{ fontSize: '1rem', py: 2.5 }}
                />
              )}
            </Box>
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

              {/* Display question image if available */}
              {question.image_url && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img 
                    src={question.image_url} 
                    alt={`Question ${index + 1} image`}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px', 
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }} 
                  />
                </Box>
              )}

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
                      []).map((option: string, optIndex: number) => (
                      <FormControlLabel
                        key={optIndex}
                        value={option}
                        control={<Radio />}
                        label={option}
                        disabled={submitting}
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
                    <FormControlLabel value="True" control={<Radio />} label="True" disabled={submitting} />
                    <FormControlLabel value="False" control={<Radio />} label="False" disabled={submitting} />
                  </RadioGroup>
                </FormControl>
              )}

              {(question.question_type === 'identification') && (
                <TextField
                  fullWidth
                  placeholder="Type your answer here..."
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={submitting}
                />
              )}

              {(question.question_type === 'essay') && (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Write your essay answer here..."
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={submitting}
                />
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Make sure to answer all questions before submitting.
          {' '}Your answers are auto-saved.
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

      {/* Save error snackbar */}
      <Snackbar
        open={saveStatus === 'error'}
        autoHideDuration={3000}
        onClose={() => setSaveStatus('idle')}
        message="Failed to save progress to server. Your answers are saved locally."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
