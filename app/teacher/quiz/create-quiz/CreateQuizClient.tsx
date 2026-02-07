'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
} from '@mui/material'
import { ArrowLeft, Delete, Upload, Sparkles } from 'lucide-react'

type QuizType = 'true-false' | 'identification' | 'multiple-choice'

interface Question {
  id: string
  type: QuizType
  question: string
  options?: string[]
  correctAnswer: string
}

interface Teacher {
  id: string
  teacher_name: string
  email: string
}

export default function CreateQuizClient({ teacher }: { teacher: Teacher }) {
  const router = useRouter()
  console.log('Teacher object received:', teacher)
  console.log('Teacher ID:', teacher?.id)
  
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai'>('manual')
  const [quizTitle, setQuizTitle] = useState('')
  const [quizType, setQuizType] = useState<QuizType>('multiple-choice')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: quizType,
      question: '',
      options: quizType === 'multiple-choice' ? ['', '', '', ''] : undefined,
      correctAnswer: '',
    }
    setQuestions([...questions, newQuestion])
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleQuestionChange = (id: string, field: string, value: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options]
        newOptions[optionIndex] = value
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadedFile(event.target.files[0])
    }
  }

  const handleGenerateAI = async () => {
    if (!uploadedFile && !aiPrompt) {
      alert('Please upload a file or provide a prompt')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      if (uploadedFile) {
        formData.append('file', uploadedFile)
      }
      formData.append('prompt', aiPrompt)
      formData.append('quizType', quizType)
      formData.append('numQuestions', '10')

      const response = await fetch('/api/teacher/generate-quiz', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'Failed to generate quiz'
        try {
          const errorData = await response.json()
          console.error('API Error:', errorData)
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch (e) {
          // If response is not JSON, try to get text
          const errorText = await response.text()
          console.error('API Error (non-JSON):', errorText)
          errorMessage = errorText || `Server error: ${response.status}`
        }
        throw new Error(errorMessage)
      }

      let data
      try {
        data = await response.json()
      } catch (e) {
        console.error('Failed to parse response JSON:', e)
        throw new Error('Invalid response from server. Please check your API key configuration.')
      }
      
      setQuestions(data.questions)
      setCreationMethod('manual')
    } catch (error) {
      console.error('Error generating quiz:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to generate quiz with AI: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuiz = async () => {
    if (!quizTitle || questions.length === 0) {
      alert('Please provide a title and at least one question')
      return
    }

    console.log('Saving quiz with teacher:', teacher)
    console.log('Teacher ID:', teacher?.id)

    if (!teacher || !teacher.id) {
      alert('Teacher information is missing. Please refresh the page and try again.')
      return
    }

    setLoading(true)
    try {
      const requestBody = {
        teacherId: teacher.id,
        title: quizTitle,
        type: quizType,
        startDate,
        endDate,
        showAnswerKey,
        questions,
      }
      
      console.log('Request body:', requestBody)

      const response = await fetch('/api/teacher/create-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        throw new Error(errorData.error || 'Failed to create quiz')
      }

      alert('Quiz created successfully!')
      router.push('/teacher/quiz')
      router.refresh()
    } catch (error) {
      console.error('Error creating quiz:', error)
      alert(`Failed to create quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '32px', marginBottom: '32px', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <IconButton onClick={() => router.push('/teacher/quiz')} sx={{ mr: 2 }}>
          <ArrowLeft />
        </IconButton>
        <Typography variant="h4">Create New Quiz</Typography>
      </div>

      <Card sx={{ p: 3 }}>
        <TextField
          fullWidth
          label="Quiz Title"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Quiz Type</InputLabel>
            <Select
              value={quizType}
              label="Quiz Type"
              onChange={(e) => setQuizType(e.target.value as QuizType)}
            >
              <MenuItem value="true-false">True/False</MenuItem>
              <MenuItem value="identification">Identification</MenuItem>
              <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="datetime-local"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            type="datetime-local"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={showAnswerKey}
              onChange={(e) => setShowAnswerKey(e.target.checked)}
            />
          }
          label="Show Answer Key to Students"
          sx={{ mb: 3 }}
        />

        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
          <Button
            variant={creationMethod === 'manual' ? 'contained' : 'outlined'}
            onClick={() => setCreationMethod('manual')}
            fullWidth
          >
            Manual Entry
          </Button>
          <Button
            variant={creationMethod === 'ai' ? 'contained' : 'outlined'}
            onClick={() => setCreationMethod('ai')}
            startIcon={<Sparkles />}
            fullWidth
          >
            AI Generated
          </Button>
        </div>

        {creationMethod === 'ai' ? (
          <div>
            <Alert severity="info" sx={{ mb: 2 }}>
              Upload a PDF, PPT, or text file, or provide a topic for AI to generate quiz questions.
            </Alert>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              fullWidth
              sx={{ mb: 2 }}
            >
              {uploadedFile ? uploadedFile.name : 'Upload File (PDF/PPT/TXT)'}
              <input
                type="file"
                hidden
                accept=".pdf,.ppt,.pptx,.txt"
                onChange={handleFileUpload}
              />
            </Button>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Or Enter Topic/Prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Generate 10 questions about World War II"
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              onClick={handleGenerateAI}
              disabled={loading || (!uploadedFile && !aiPrompt)}
              fullWidth
            >
              {loading ? 'Generating...' : 'Generate Questions'}
            </Button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Typography variant="h6">Questions ({questions.length})</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddQuestion}
              >
                Add Question
              </Button>
            </div>

            {questions.length > 0 && (
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>#</strong></TableCell>
                      <TableCell><strong>Question</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Correct Answer</strong></TableCell>
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {questions.map((question, index) => (
                      <TableRow key={question.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          {question.question || <em style={{ color: '#999' }}>No question text</em>}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={question.type.replace('-', ' ')} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {question.type === 'multiple-choice' 
                            ? `Option ${question.correctAnswer}` 
                            : question.correctAnswer || <em style={{ color: '#999' }}>Not set</em>
                          }
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteQuestion(question.id)}
                            title="Delete Question"
                          >
                            <Delete size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {questions.map((question, index) => (
              <Card key={question.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Typography variant="subtitle1">Question {index + 1}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Delete />
                  </IconButton>
                </div>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Question"
                  value={question.question}
                  onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
                  sx={{ mb: 2 }}
                />

                {question.type === 'multiple-choice' && question.options && (
                  <div style={{ marginBottom: '16px' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Options</Typography>
                    {question.options.map((option, optIndex) => (
                      <TextField
                        key={optIndex}
                        fullWidth
                        label={`Option ${String.fromCharCode(65 + optIndex)}`}
                        value={option}
                        onChange={(e) => handleOptionChange(question.id, optIndex, e.target.value)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </div>
                )}

                {question.type === 'true-false' ? (
                  <FormControl fullWidth>
                    <InputLabel>Correct Answer</InputLabel>
                    <Select
                      value={question.correctAnswer}
                      label="Correct Answer"
                      onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
                    >
                      <MenuItem value="true">True</MenuItem>
                      <MenuItem value="false">False</MenuItem>
                    </Select>
                  </FormControl>
                ) : question.type === 'multiple-choice' ? (
                  <FormControl fullWidth>
                    <InputLabel>Correct Answer</InputLabel>
                    <Select
                      value={question.correctAnswer}
                      label="Correct Answer"
                      onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
                    >
                      <MenuItem value="A">Option A</MenuItem>
                      <MenuItem value="B">Option B</MenuItem>
                      <MenuItem value="C">Option C</MenuItem>
                      <MenuItem value="D">Option D</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label="Correct Answer"
                    value={question.correctAnswer}
                    onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
                  />
                )}
              </Card>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/teacher/quiz')}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveQuiz}
            disabled={loading || !quizTitle || questions.length === 0}
            fullWidth
          >
            Save Quiz
          </Button>
        </div>
      </Card>
    </div>
  )
}
