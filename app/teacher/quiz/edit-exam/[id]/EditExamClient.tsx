'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  IconButton,
  Card,
  CardContent,
  MenuItem,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import NotificationModal, { type ModalSeverity } from '../../components/NotificationModal'
import ConfirmationModal from '@/app/components/ConfirmationModal'
import { isDuplicateQuestion } from '../../utils/duplicateDetection'

interface Question {
  id: string
  question: string
  question_type: string
  options?: string[]
  correct_answer?: string
  points?: number
  order_number: number
}

interface Exam {
  id: string
  title: string
  period?: string
  school_name?: string
  introduction?: string
  show_answer_key?: boolean
}

interface EditExamClientProps {
  exam: Exam
  questions: Question[]
}

export default function EditExamClient({ exam: initialExam, questions: initialQuestions }: EditExamClientProps) {
  const router = useRouter()
  const [exam, setExam] = useState(initialExam)
  const [questions, setQuestions] = useState(initialQuestions)
  const [saving, setSaving] = useState(false)

  // Notification modal state
  const [modal, setModal] = useState<{
    open: boolean
    title?: string
    message: string
    severity: ModalSeverity
    autoCloseMs?: number
    actionLabel?: string
    onAction?: () => void
  }>({ open: false, message: '', severity: 'info' })

  // Duplicate warning per question (real-time)
  const [duplicateWarnings, setDuplicateWarnings] = useState<Record<number, boolean>>({})

  // Delete question confirmation
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null)

  const showModal = useCallback((severity: ModalSeverity, message: string, opts?: { title?: string; autoCloseMs?: number; actionLabel?: string; onAction?: () => void }) => {
    setModal({ open: true, message, severity, ...opts })
  }, [])

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, open: false }))
  }, [])

  const handleSave = async () => {
    // Check for duplicate questions before saving
    for (let i = 0; i < questions.length; i++) {
      if (isDuplicateQuestion(questions[i].question, questions, i)) {
        showModal('duplicate', 'This question already exists. Duplicate questions are not allowed.', {
          title: 'Duplicate Detected',
        })
        return
      }
    }

    setSaving(true)
    try {
      // Update exam
      const examResponse = await fetch(`/api/teacher/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: exam.title,
          period: exam.period,
          school_name: exam.school_name,
          introduction: exam.introduction,
          show_answer_key: exam.show_answer_key,
        }),
      })

      if (!examResponse.ok) throw new Error('Failed to update exam')

      // Update questions
      const questionsResponse = await fetch(`/api/teacher/exams/${exam.id}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      })

      if (!questionsResponse.ok) throw new Error('Failed to update questions')

      showModal('success', 'Exam updated successfully!', {
        title: 'Exam Updated!',
        actionLabel: 'Go to Quizzes',
        onAction: () => {
          closeModal()
          router.push('/teacher/quiz')
        },
        autoCloseMs: 3000,
      })
    } catch {
      showModal('error', 'Failed to save exam. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `new-${Date.now()}`,
      question: '',
      question_type: 'multiple-choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
      order_number: questions.length + 1,
    }
    setQuestions([...questions, newQuestion])
  }

  const handleDeleteQuestion = (index: number) => {
    setQuestionToDelete(index)
  }

  const handleDeleteQuestionConfirm = () => {
    if (questionToDelete === null) return
    const updatedQuestions = questions.filter((_, i) => i !== questionToDelete)
    setQuestions(updatedQuestions.map((q, i) => ({ ...q, order_number: i + 1 })))
    setDuplicateWarnings(prev => {
      const next = { ...prev }
      delete next[questionToDelete]
      return next
    })
    setQuestionToDelete(null)
  }

  const updateQuestion = (index: number, field: string, value: string | string[] | number) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)

    // Real-time duplicate detection when question text changes
    if (field === 'question' && typeof value === 'string') {
      const hasDuplicate = isDuplicateQuestion(value, updated, index)
      setDuplicateWarnings(prev => ({ ...prev, [index]: hasDuplicate }))
    }
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => router.push('/teacher/quiz')}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Save />}
          onClick={handleSave}
          variant="contained"
          disabled={saving || Object.values(duplicateWarnings).some(Boolean)}
        >
          {saving ? 'Saving...' : 'Save Exam'}
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Edit Exam
        </Typography>

        <TextField
          fullWidth
          label="School Name"
          value={exam.school_name || ''}
          onChange={(e) => setExam({ ...exam, school_name: e.target.value })}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Exam Title"
          value={exam.title}
          onChange={(e) => setExam({ ...exam, title: e.target.value })}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Period"
          select
          value={exam.period || 'prelim'}
          onChange={(e) => setExam({ ...exam, period: e.target.value })}
          margin="normal"
        >
          <MenuItem value="prelim">Prelim</MenuItem>
          <MenuItem value="midterm">Midterm</MenuItem>
          <MenuItem value="finals">Finals</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Introduction / Instructions"
          multiline
          rows={4}
          value={exam.introduction || ''}
          onChange={(e) => setExam({ ...exam, introduction: e.target.value })}
          margin="normal"
          helperText="Instructions that will appear at the top of the exam"
        />

        <FormControlLabel
          control={
            <Switch
              checked={exam.show_answer_key || false}
              onChange={(e) => setExam({ ...exam, show_answer_key: e.target.checked })}
            />
          }
          label="Show Answer Key (for printing/preview)"
          sx={{ mt: 2 }}
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Questions</Typography>
        <Button startIcon={<Plus />} onClick={handleAddQuestion} variant="outlined">
          Add Question
        </Button>
      </Box>

      {questions.map((question, index) => (
        <Card key={question.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Question {index + 1}</Typography>
              <IconButton onClick={() => handleDeleteQuestion(index)} color="error" size="small">
                <Trash2 size={20} />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              label="Question Type"
              select
              value={question.question_type}
              onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
              margin="normal"
            >
              <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
              <MenuItem value="true-false">True/False</MenuItem>
              <MenuItem value="short-answer">Short Answer</MenuItem>
              <MenuItem value="essay">Essay</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Question"
              multiline
              rows={2}
              value={question.question}
              onChange={(e) => updateQuestion(index, 'question', e.target.value)}
              margin="normal"
              required
              error={duplicateWarnings[index]}
              helperText={duplicateWarnings[index] ? 'Duplicate question detected — this question already exists.' : ''}
            />
            {duplicateWarnings[index] && (
              <Alert severity="error" sx={{ mb: 1 }}>
                This question already exists. Duplicate questions are not allowed.
              </Alert>
            )}

            <TextField
              label="Points"
              type="number"
              value={question.points || 1}
              onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
              margin="normal"
              sx={{ width: 120 }}
            />

            {question.question_type === 'multiple-choice' && (
              <Box sx={{ mt: 2 }}>
                {question.options?.map((option, optIndex) => (
                  <TextField
                    key={optIndex}
                    fullWidth
                    label={`Option ${String.fromCharCode(65 + optIndex)}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])]
                      newOptions[optIndex] = e.target.value
                      updateQuestion(index, 'options', newOptions)
                    }}
                    margin="normal"
                  />
                ))}
                <TextField
                  fullWidth
                  label="Correct Answer"
                  select
                  value={question.correct_answer || ''}
                  onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                  margin="normal"
                >
                  {question.options?.map((option, optIndex) => (
                    <MenuItem key={optIndex} value={option}>
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            )}

            {question.question_type === 'true-false' && (
              <TextField
                fullWidth
                label="Correct Answer"
                select
                value={question.correct_answer || ''}
                onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                margin="normal"
              >
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </TextField>
            )}

            {(question.question_type === 'short-answer' || question.question_type === 'essay') && (
              <TextField
                fullWidth
                label={question.question_type === 'essay' ? 'Grading Rubric / Key Points' : 'Sample Answer'}
                multiline
                rows={question.question_type === 'essay' ? 4 : 2}
                value={question.correct_answer || ''}
                onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                margin="normal"
                helperText="This will be shown in the answer key if enabled"
              />
            )}
          </CardContent>
        </Card>
      ))}

      <NotificationModal
        open={modal.open}
        onClose={() => {
          if (modal.onAction) {
            modal.onAction()
          } else {
            closeModal()
          }
        }}
        title={modal.title}
        message={modal.message}
        severity={modal.severity}
        autoCloseMs={modal.autoCloseMs}
        actionLabel={modal.actionLabel}
        onAction={modal.onAction}
      />
      {/* Delete Question Confirmation */}
      <ConfirmationModal
        open={questionToDelete !== null}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={handleDeleteQuestionConfirm}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </Box>
  )
}
