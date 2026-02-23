'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material'
import { ArrowLeft, Delete, Plus } from 'lucide-react'
import NotificationModal, { type ModalSeverity } from '../components/NotificationModal'
import ConfirmationModal from '@/app/components/ConfirmationModal'
import { isDuplicateQuestion } from '../utils/duplicateDetection'

interface Question {
  id: string
  question: string
}

interface Teacher {
  id: string
  teacher_name: string
  email: string
}

export default function CreateAssignmentClient({ teacher }: { teacher: Teacher }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [allowedTypes, setAllowedTypes] = useState('.pdf,.doc,.docx')
  const [maxSize, setMaxSize] = useState('10')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)

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
  const [duplicateWarnings, setDuplicateWarnings] = useState<Record<string, boolean>>({})

  // Delete question confirmation
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)

  const showModal = useCallback((severity: ModalSeverity, message: string, opts?: { title?: string; autoCloseMs?: number; actionLabel?: string; onAction?: () => void }) => {
    setModal({ open: true, message, severity, ...opts })
  }, [])

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, open: false }))
  }, [])

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
    }
    setQuestions([...questions, newQuestion])
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestionToDelete(id)
  }

  const handleDeleteQuestionConfirm = () => {
    if (!questionToDelete) return
    setQuestions(questions.filter(q => q.id !== questionToDelete))
    setDuplicateWarnings(prev => {
      const next = { ...prev }
      delete next[questionToDelete]
      return next
    })
    setQuestionToDelete(null)
  }

  const handleQuestionChange = (id: string, value: string) => {
    setQuestions(prev => {
      const updated = prev.map(q =>
        q.id === id ? { ...q, question: value } : q
      )

      // Real-time duplicate detection
      const questionIndex = updated.findIndex(q => q.id === id)
      const hasDuplicate = isDuplicateQuestion(value, updated, questionIndex)
      setDuplicateWarnings(prevW => ({ ...prevW, [id]: hasDuplicate }))

      return updated
    })
  }

  const handleCreateAssignment = async () => {
    if (!title || !description || !dueDate) {
      showModal('warning', 'Please fill in all required fields.')
      return
    }

    // Check for duplicate questions before saving
    for (let i = 0; i < questions.length; i++) {
      if (isDuplicateQuestion(questions[i].question, questions, i)) {
        showModal('duplicate', 'This question already exists. Duplicate questions are not allowed.', {
          title: 'Duplicate Detected',
        })
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/teacher/create-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          title,
          description,
          dueDate,
          allowedFileTypes: allowedTypes.split(',').map(t => t.trim()),
          maxFileSize: parseInt(maxSize),
          questions,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        throw new Error(errorData.error || 'Failed to create assignment')
      }

      showModal('success', 'Your assignment was created successfully.', {
        title: 'Assignment Created!',
        actionLabel: 'Go to Quizzes',
        onAction: () => {
          closeModal()
          router.push('/teacher/quiz')
          router.refresh()
        },
        autoCloseMs: 5000,
      })
    } catch (error) {
      console.error('Error creating assignment:', error)
      showModal('error', `Failed to create assignment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/teacher/quiz')} sx={{ mr: 2 }}>
          <ArrowLeft />
        </IconButton>
        <Typography variant="h4">Create New Assignment</Typography>
      </Box>

      <Card sx={{ p: 3 }}>
        <TextField
          fullWidth
          label="Assignment Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
          required
        />

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Description/Instructions"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
          required
        />

        <TextField
          fullWidth
          type="datetime-local"
          label="Due Date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          required
        />

        <TextField
          fullWidth
          label="Allowed File Types"
          value={allowedTypes}
          onChange={(e) => setAllowedTypes(e.target.value)}
          placeholder=".pdf,.doc,.docx,.txt"
          helperText="Comma-separated file extensions"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          type="number"
          label="Max File Size (MB)"
          value={maxSize}
          onChange={(e) => setMaxSize(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Assignment Questions (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add questions or instructions that students should answer or follow
        </Typography>

        <Button
          variant="outlined"
          startIcon={<Plus />}
          onClick={handleAddQuestion}
          sx={{ mb: 2 }}
        >
          Add Question
        </Button>

        {questions.map((question, index) => (
          <Card key={question.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1">
                Question {index + 1}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleDeleteQuestion(question.id)}
              >
                <Delete />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Question"
              value={question.question}
              onChange={(e) => handleQuestionChange(question.id, e.target.value)}
              placeholder="Enter your question or instruction here"
              error={duplicateWarnings[question.id]}
              helperText={duplicateWarnings[question.id] ? 'Duplicate question detected — this question already exists.' : ''}
            />
            {duplicateWarnings[question.id] && (
              <Alert severity="error" sx={{ mt: 0.5 }}>
                This question already exists. Duplicate questions are not allowed.
              </Alert>
            )}
          </Card>
        ))}

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/teacher/quiz')}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateAssignment}
            variant="contained"
            disabled={loading || !title || !description || !dueDate || Object.values(duplicateWarnings).some(Boolean)}
            fullWidth
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Assignment'}
          </Button>
        </Box>
      </Card>

      {/* Notification Modal */}
      {/* Notification Modal */}
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
        open={!!questionToDelete}
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
