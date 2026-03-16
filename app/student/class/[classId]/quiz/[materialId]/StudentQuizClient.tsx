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
import { ArrowLeft, Clock, Send, Save, ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [currentPage, setCurrentPage] = useState(0) // 0-indexed page number
  const [pageValidationError, setPageValidationError] = useState('')
  const [unansweredOnPage, setUnansweredOnPage] = useState<string[]>([])

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

    // Clear validation highlight for this question when answered
    setUnansweredOnPage(prev => {
      const remaining = prev.filter(id => id !== questionId)
      if (remaining.length === 0) setPageValidationError('')
      return remaining
    })
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

  // ── Page computation ─────────────────────────────────────────────────────
  // ≤10 questions → single page (no pagination). >10 → 10 per page.
  const QUESTIONS_PER_PAGE = 10
  const totalPages =
    questions.length <= QUESTIONS_PER_PAGE
      ? 1
      : Math.ceil(questions.length / QUESTIONS_PER_PAGE)
  const pageStart       = currentPage * QUESTIONS_PER_PAGE
  const pageEnd         = Math.min(pageStart + QUESTIONS_PER_PAGE, questions.length)
  const pageQuestions   = questions.slice(pageStart, pageEnd)
  const pageAnsweredCount = pageQuestions.filter(q => !!answers[q.id]).length

  // ── Page handlers ─────────────────────────────────────────────────────────
  const handleNextPage = () => {
    const unanswered = pageQuestions.filter(q => !answers[q.id]).map(q => q.id)
    if (unanswered.length > 0) {
      setPageValidationError('Please answer all required questions before proceeding.')
      setUnansweredOnPage(unanswered)
      document.getElementById(`question-${unanswered[0]}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    saveProgressToDB(latestAnswersRef.current)
    setCurrentPage(p => p + 1)
    setPageValidationError('')
    setUnansweredOnPage([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevPage = () => {
    saveProgressToDB(latestAnswersRef.current)
    setCurrentPage(p => Math.max(0, p - 1))
    setPageValidationError('')
    setUnansweredOnPage([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLastPageSubmit = () => {
    const unanswered = pageQuestions.filter(q => !answers[q.id]).map(q => q.id)
    if (unanswered.length > 0) {
      setPageValidationError('Please answer all required questions before submitting.')
      setUnansweredOnPage(unanswered)
      document.getElementById(`question-${unanswered[0]}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    handleSubmit()
  }

  const normalizeOptions = (opts: Question['options']): string[] => {
    if (Array.isArray(opts)) return opts
    if (typeof opts === 'string') {
      try { return JSON.parse(opts) } catch { return [] }
    }
    return []
  }

  // Shared button style tokens
  const purpleContained = {
    bgcolor: 'rgb(147, 51, 234)',
    '&:hover': { bgcolor: 'rgb(126, 34, 206)' },
    '&:disabled': { bgcolor: 'grey.300' },
  }
  const purpleOutlined = {
    borderColor: 'rgb(147, 51, 234)',
    color: 'rgb(147, 51, 234)',
    '&:hover': { borderColor: 'rgb(126, 34, 206)', bgcolor: 'rgba(147,51,234,0.04)' },
    '&:disabled': { borderColor: 'grey.300', color: 'grey.400' },
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

      {/* ── Quiz header card ─────────────────────────────────────────────── */}
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
                <Chip icon={<Save size={14} />} label="Saving…" size="small" variant="outlined" />
              )}
              {saveStatus === 'saved' && (
                <Chip icon={<Save size={14} />} label="Saved" size="small" color="success" variant="outlined" />
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Overall Progress</Typography>
              <Typography variant="caption" color="text.secondary">{Math.round(progress)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
          </Box>
        </CardContent>
      </Card>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {questions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">No questions available for this quiz</Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Page navigation header (multi-page only) ─────────────────── */}
          {totalPages > 1 && (
            <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* Page label + answered-on-this-page count */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body1" fontWeight="bold" color="rgb(147, 51, 234)">
                    Page {currentPage + 1} of {totalPages}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Q{pageStart + 1}–Q{pageEnd}
                    </Typography>
                    <Chip
                      label={`${pageAnsweredCount}/${pageQuestions.length}`}
                      size="small"
                      color={pageAnsweredCount === pageQuestions.length ? 'success' : 'default'}
                      variant={pageAnsweredCount === pageQuestions.length ? 'filled' : 'outlined'}
                    />
                  </Box>
                </Box>

                {/* Clickable question-number dots for current page */}
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {pageQuestions.map((q, idx) => {
                    const isAnswered    = !!answers[q.id]
                    const isHighlighted = unansweredOnPage.includes(q.id)
                    return (
                      <Box
                        key={q.id}
                        onClick={() =>
                          document
                            .getElementById(`question-${q.id}`)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                        sx={{
                          width: 34, height: 34,
                          borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: 600,
                          cursor: 'pointer',
                          border: '1.5px solid',
                          bgcolor: isHighlighted
                            ? 'error.main'
                            : isAnswered ? 'rgb(16, 185, 129)' : 'white',
                          color: isHighlighted || isAnswered ? 'white' : 'text.primary',
                          borderColor: isHighlighted
                            ? 'error.main'
                            : isAnswered ? 'rgb(16, 185, 129)' : 'grey.300',
                          transition: 'all 0.15s ease-in-out',
                          '&:hover': { transform: 'scale(1.1)' },
                        }}
                      >
                        {pageStart + idx + 1}
                      </Box>
                    )
                  })}
                </Box>

                {/* Page progress dots */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1.5 }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: currentPage === i ? 18 : 8,
                        height: 8,
                        borderRadius: '4px',
                        bgcolor: currentPage === i ? 'rgb(147, 51, 234)' : 'grey.300',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </Box>

                {/* Legend */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                  {[
                    { color: 'rgb(16, 185, 129)', label: 'Answered' },
                    { color: 'error.main',        label: 'Requires answer' },
                    { color: 'white', border: true, label: 'Unanswered' },
                  ].map(({ color, border, label }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color, ...(border ? { border: '1px solid', borderColor: 'grey.300' } : {}) }} />
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ── Validation alert ─────────────────────────────────────────── */}
          {pageValidationError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => { setPageValidationError(''); setUnansweredOnPage([]) }}
            >
              {pageValidationError}
            </Alert>
          )}

          {/* ── Questions on current page ────────────────────────────────── */}
          {pageQuestions.map((question, pageIdx) => {
            const globalIdx     = pageStart + pageIdx
            const isAnswered    = !!answers[question.id]
            const isHighlighted = unansweredOnPage.includes(question.id)

            return (
              <Card
                key={question.id}
                id={`question-${question.id}`}
                sx={{
                  mb: 2,
                  borderLeft: 4,
                  borderColor: isHighlighted
                    ? 'error.main'
                    : isAnswered ? 'success.main' : 'divider',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <CardContent>
                  {/* Question header row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 28, height: 28,
                          borderRadius: '50%',
                          bgcolor: isAnswered
                            ? 'rgb(16, 185, 129)'
                            : isHighlighted ? 'error.main' : 'rgb(147, 51, 234)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                        }}
                      >
                        {globalIdx + 1}
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        {question.question_type === 'multiple-choice' ? 'Multiple Choice'
                          : question.question_type === 'true-false'    ? 'True or False'
                          : question.question_type === 'identification' ? 'Identification'
                          : 'Essay'}
                      </Typography>
                    </Box>
                    <Chip label={`${question.points || 1} pts`} size="small" variant="outlined" />
                  </Box>

                  {/* Optional image */}
                  {question.image_url && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                      <img
                        src={question.image_url}
                        alt={`Question ${globalIdx + 1}`}
                        style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #ddd' }}
                      />
                    </Box>
                  )}

                  {/* Question text */}
                  <Typography variant="body1" sx={{ mb: 2.5, fontWeight: 500 }}>
                    {question.question}
                  </Typography>

                  {/* Multiple choice */}
                  {question.question_type === 'multiple-choice' && question.options && (
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        value={answers[question.id] || ''}
                        onChange={e => handleAnswerChange(question.id, e.target.value)}
                      >
                        {normalizeOptions(question.options).map((opt, i) => (
                          <FormControlLabel
                            key={i}
                            value={opt}
                            control={<Radio />}
                            label={opt}
                            disabled={submitting}
                            sx={{
                              p: 0.5, borderRadius: 1,
                              bgcolor: answers[question.id] === opt ? 'rgba(147,51,234,0.07)' : 'transparent',
                            }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}

                  {/* True / False */}
                  {question.question_type === 'true-false' && (
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        value={answers[question.id] || ''}
                        onChange={e => handleAnswerChange(question.id, e.target.value)}
                      >
                        {['True', 'False'].map(val => (
                          <FormControlLabel
                            key={val}
                            value={val}
                            control={<Radio />}
                            label={val}
                            disabled={submitting}
                            sx={{
                              p: 0.5, borderRadius: 1,
                              bgcolor: answers[question.id] === val ? 'rgba(147,51,234,0.07)' : 'transparent',
                            }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}

                  {/* Identification */}
                  {question.question_type === 'identification' && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type your answer here…"
                      value={answers[question.id] || ''}
                      onChange={e => handleAnswerChange(question.id, e.target.value)}
                      disabled={submitting}
                    />
                  )}

                  {/* Essay */}
                  {question.question_type === 'essay' && (
                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      placeholder="Write your essay answer here…"
                      value={answers[question.id] || ''}
                      onChange={e => handleAnswerChange(question.id, e.target.value)}
                      disabled={submitting}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* ── Page navigation footer ───────────────────────────────────── */}
          <Card sx={{ mt: 1, bgcolor: 'grey.50' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                {/* Previous page */}
                <Button
                  variant="outlined"
                  startIcon={<ChevronLeft size={18} />}
                  onClick={handlePrevPage}
                  disabled={currentPage === 0 || submitting}
                  sx={purpleOutlined}
                >
                  Previous
                </Button>

                {/* Centre indicator */}
                <Box sx={{ textAlign: 'center' }}>
                  {totalPages > 1 ? (
                    <>
                      <Typography variant="body1" fontWeight="bold">
                        Page {currentPage + 1} of {totalPages}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Q{pageStart + 1}–Q{pageEnd} of {questions.length}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {answeredCount} / {questions.length} answered
                    </Typography>
                  )}
                </Box>

                {/* Next page or Submit */}
                {currentPage < totalPages - 1 ? (
                  <Button
                    variant="contained"
                    endIcon={<ChevronRight size={18} />}
                    onClick={handleNextPage}
                    disabled={submitting}
                    sx={purpleContained}
                  >
                    Next Page
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
                    onClick={handleLastPageSubmit}
                    disabled={submitting}
                    sx={purpleContained}
                  >
                    {submitting ? 'Submitting…' : 'Submit Quiz'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* Save-error snackbar */}
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
