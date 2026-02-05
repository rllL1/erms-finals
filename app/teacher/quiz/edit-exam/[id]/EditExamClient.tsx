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
  FormControlLabel,
  Switch,
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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
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

      setMessage({ type: 'success', text: 'Exam updated successfully!' })
      setTimeout(() => {
        router.push('/teacher/quiz')
      }, 1500)
    } catch {
      setMessage({ type: 'error', text: 'Failed to save exam. Please try again.' })
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

  const updateQuestion = (index: number, field: string, value: string | string[] | number) => {
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
