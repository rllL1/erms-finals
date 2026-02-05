'use client'

import { useState } from 'react'
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
  Snackbar,
} from '@mui/material'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

interface Question {
  id: string
  question: string
  question_type: string
  options?: string[]
  correct_answer?: string
  points?: number
  order_number: number
}

interface Quiz {
  id: string
  title: string
  quiz_type?: string
  description?: string
  start_date: string | null
  end_date: string | null
  time_limit?: number
}

interface EditQuizClientProps {
  quiz: Quiz
  questions: Question[]
}

export default function EditQuizClient({ quiz: initialQuiz, questions: initialQuestions }: EditQuizClientProps) {
  const router = useRouter()
  const [quiz, setQuiz] = useState(initialQuiz)
  const [questions, setQuestions] = useState(initialQuestions)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update quiz
      const quizResponse = await fetch(`/api/teacher/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quiz.title,
          quiz_type: quiz.quiz_type,
          description: quiz.description,
          start_date: quiz.start_date,
          end_date: quiz.end_date,
          time_limit: quiz.time_limit,
        }),
      })

      if (!quizResponse.ok) throw new Error('Failed to update quiz')

      // Update questions
      const questionsResponse = await fetch(`/api/teacher/quizzes/${quiz.id}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      })

      if (!questionsResponse.ok) throw new Error('Failed to update questions')

      setMessage({ type: 'success', text: 'Quiz updated successfully!' })
      setTimeout(() => {
        router.push('/teacher/quiz')
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save quiz. Please try again.' })
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
    const updatedQuestions = questions.filter((_, i) => i !== index)
    setQuestions(updatedQuestions.map((q, i) => ({ ...q, order_number: i + 1 })))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
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
          startIcon={<Save />}
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Quiz'}
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Edit Quiz
        </Typography>

        <TextField
          fullWidth
          label="Quiz Title"
          value={quiz.title}
          onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Quiz Type"
          select
          value={quiz.quiz_type || 'practice'}
          onChange={(e) => setQuiz({ ...quiz, quiz_type: e.target.value })}
          margin="normal"
        >
          <MenuItem value="practice">Practice Quiz</MenuItem>
          <MenuItem value="graded">Graded Quiz</MenuItem>
          <MenuItem value="survey">Survey</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Description"
          multiline
          rows={3}
          value={quiz.description || ''}
          onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
          margin="normal"
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mt: 2 }}>
          <TextField
            label="Start Date"
            type="datetime-local"
            value={quiz.start_date ? new Date(quiz.start_date).toISOString().slice(0, 16) : ''}
            onChange={(e) => setQuiz({ ...quiz, start_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="datetime-local"
            value={quiz.end_date ? new Date(quiz.end_date).toISOString().slice(0, 16) : ''}
            onChange={(e) => setQuiz({ ...quiz, end_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Time Limit (minutes)"
            type="number"
            value={quiz.time_limit || ''}
            onChange={(e) => setQuiz({ ...quiz, time_limit: parseInt(e.target.value) || undefined })}
          />
        </Box>
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
            />

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
          </CardContent>
        </Card>
      ))}

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
      >
        <Alert severity={message?.type} onClose={() => setMessage(null)}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  )
}
