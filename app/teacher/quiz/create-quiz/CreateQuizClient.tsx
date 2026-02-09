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
  Snackbar,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import { ArrowLeft, Delete, Upload, Sparkles, CheckCircle, Image as ImageIcon, X } from 'lucide-react'

type QuizType = 'true-false' | 'identification' | 'multiple-choice' | 'essay'

interface Question {
  id: string
  type: QuizType
  question: string
  options?: string[]
  correctAnswer: string
  points?: number
  imageUrl?: string
  imageFile?: File
  imageUploading?: boolean
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
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  
  // Per-type question counts for AI generation
  const [multipleChoiceCount, setMultipleChoiceCount] = useState(0)
  const [trueFalseCount, setTrueFalseCount] = useState(0)
  const [identificationCount, setIdentificationCount] = useState(0)
  const [essayCount, setEssayCount] = useState(0)
  
  const [loading, setLoading] = useState(false)
  
  // Snackbar/Modal state
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({ open: false, message: '', severity: 'info' })
  const [successModal, setSuccessModal] = useState(false)

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: quizType,
      question: '',
      options: quizType === 'multiple-choice' ? ['', '', '', ''] : undefined,
      correctAnswer: quizType === 'essay' ? '' : '',
      points: quizType === 'essay' ? 10 : undefined,
      imageUrl: undefined,
      imageFile: undefined,
      imageUploading: false,
    }
    setQuestions([...questions, newQuestion])
  }

  const handleImageUpload = async (questionId: string, file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Invalid file type. Only JPG and PNG are allowed.', severity: 'error' })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setSnackbar({ open: true, message: 'File too large. Maximum size is 5MB.', severity: 'error' })
      return
    }

    // Set uploading state
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, imageUploading: true } : q
    ))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('questionId', questionId)

      const response = await fetch('/api/teacher/upload-question-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setQuestions(questions.map(q => 
          q.id === questionId ? { ...q, imageUrl: data.imageUrl, imageFile: file, imageUploading: false } : q
        ))
        setSnackbar({ open: true, message: 'Image uploaded successfully', severity: 'success' })
      } else {
        throw new Error(data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, imageUploading: false } : q
      ))
      setSnackbar({ open: true, message: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' })
    }
  }

  const handleRemoveImage = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, imageUrl: undefined, imageFile: undefined } : q
    ))
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleQuestionChange = (id: string, field: string, value: string | number) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        // Handle points as a number
        if (field === 'points') {
          return { ...q, [field]: parseInt(String(value)) || 1 }
        }
        return { ...q, [field]: value }
      }
      return q
    }))
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
      setSnackbar({ open: true, message: 'Please upload a file or provide a prompt', severity: 'warning' })
      return
    }

    const totalQuestions = multipleChoiceCount + trueFalseCount + identificationCount
    if (totalQuestions === 0) {
      setSnackbar({ open: true, message: 'Please specify at least one question to generate', severity: 'warning' })
      return
    }

    setLoading(true)
    try {
      const allQuestions: Question[] = []
      
      // Generate multiple choice questions
      if (multipleChoiceCount > 0) {
        const formData = new FormData()
        if (uploadedFile) {
          formData.append('file', uploadedFile)
        }
        formData.append('prompt', aiPrompt)
        formData.append('quizType', 'multiple-choice')
        formData.append('numQuestions', String(multipleChoiceCount))

        const response = await fetch('/api/teacher/generate-quiz', {
          method: 'POST',
          body: formData,
        })

<<<<<<< HEAD
        if (response.ok) {
          const data = await response.json()
          allQuestions.push(...data.questions)
        }
      }

      // Generate true/false questions
      if (trueFalseCount > 0) {
        const formData = new FormData()
        if (uploadedFile) {
          formData.append('file', uploadedFile)
        }
        formData.append('prompt', aiPrompt)
        formData.append('quizType', 'true-false')
        formData.append('numQuestions', String(trueFalseCount))

        const response = await fetch('/api/teacher/generate-quiz', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          allQuestions.push(...data.questions)
        }
      }

      // Generate identification questions
      if (identificationCount > 0) {
        const formData = new FormData()
        if (uploadedFile) {
          formData.append('file', uploadedFile)
        }
        formData.append('prompt', aiPrompt)
        formData.append('quizType', 'identification')
        formData.append('numQuestions', String(identificationCount))

        const response = await fetch('/api/teacher/generate-quiz', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          allQuestions.push(...data.questions)
        }
      }

      // Generate essay questions
      if (essayCount > 0) {
        const formData = new FormData()
        if (uploadedFile) {
          formData.append('file', uploadedFile)
        }
        formData.append('prompt', aiPrompt)
        formData.append('quizType', 'essay')
        formData.append('numQuestions', String(essayCount))

        const response = await fetch('/api/teacher/generate-quiz', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          // Add default points to essay questions
          const essayQuestions = data.questions.map((q: Question) => ({
            ...q,
            points: 10, // Default 10 points for essay questions
          }))
          allQuestions.push(...essayQuestions)
        }
      }

      if (allQuestions.length === 0) {
        throw new Error('Failed to generate any questions')
      }

      // Re-assign IDs
      const questionsWithIds = allQuestions.map((q, index) => ({
        ...q,
        id: String(Date.now() + index),
      }))

      setQuestions(questionsWithIds)
=======
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
>>>>>>> 0cbd602de8bd693373398984b87275a6b57e1b3d
      setCreationMethod('manual')
      setSnackbar({ open: true, message: `Generated ${questionsWithIds.length} questions successfully!`, severity: 'success' })
    } catch (error) {
      console.error('Error generating quiz:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setSnackbar({ open: true, message: `Failed to generate quiz with AI: ${errorMessage}`, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuiz = async () => {
    if (!quizTitle || questions.length === 0) {
      setSnackbar({ open: true, message: 'Please provide a title and at least one question', severity: 'warning' })
      return
    }

    console.log('Saving quiz with teacher:', teacher)
    console.log('Teacher ID:', teacher?.id)

    if (!teacher || !teacher.id) {
      setSnackbar({ open: true, message: 'Teacher information is missing. Please refresh the page and try again.', severity: 'error' })
      return
    }

    setLoading(true)
    try {
      const requestBody = {
        teacherId: teacher.id,
        title: quizTitle,
        type: quizType,
        startDate,
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

      setSuccessModal(true)
    } catch (error) {
      console.error('Error creating quiz:', error)
      setSnackbar({ open: true, message: `Failed to create quiz: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' })
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
              <MenuItem value="essay">Essay</MenuItem>
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
              placeholder="e.g., Generate questions about World War II"
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Number of Questions by Type
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Multiple Choice"
                value={multipleChoiceCount}
                onChange={(e) => setMultipleChoiceCount(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                inputProps={{ min: 0, max: 50 }}
              />
              <TextField
                fullWidth
                type="number"
                label="True/False"
                value={trueFalseCount}
                onChange={(e) => setTrueFalseCount(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                inputProps={{ min: 0, max: 50 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Identification"
                value={identificationCount}
                onChange={(e) => setIdentificationCount(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                inputProps={{ min: 0, max: 50 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Essay"
                value={essayCount}
                onChange={(e) => setEssayCount(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                inputProps={{ min: 0, max: 20 }}
                helperText="Scored by teacher"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Total: {multipleChoiceCount + trueFalseCount + identificationCount + essayCount} questions
            </Typography>

            <Button
              variant="contained"
              onClick={handleGenerateAI}
              disabled={loading || (!uploadedFile && !aiPrompt) || (multipleChoiceCount + trueFalseCount + identificationCount + essayCount === 0)}
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

                {/* Image Upload Section */}
                <Box sx={{ mb: 2 }}>
                  {question.imageUrl ? (
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 1 }}>
                      <img 
                        src={question.imageUrl} 
                        alt="Question image" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px', 
                          borderRadius: '8px',
                          border: '1px solid #ddd'
                        }} 
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(question.id)}
                        sx={{ 
                          position: 'absolute', 
                          top: 4, 
                          right: 4, 
                          bgcolor: 'rgba(255,255,255,0.9)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                        }}
                      >
                        <X size={16} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      startIcon={question.imageUploading ? <CircularProgress size={16} /> : <ImageIcon size={16} />}
                      disabled={question.imageUploading}
                      sx={{ mb: 1 }}
                    >
                      {question.imageUploading ? 'Uploading...' : 'Add Image (Optional)'}
                      <input
                        type="file"
                        hidden
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(question.id, e.target.files[0])
                          }
                        }}
                      />
                    </Button>
                  )}
                </Box>

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
                ) : question.type === 'essay' ? (
                  <Box>
                    <TextField
                      fullWidth
                      type="number"
                      label="Points"
                      value={question.points || 10}
                      onChange={(e) => handleQuestionChange(question.id, 'points', e.target.value)}
                      inputProps={{ min: 1, max: 100 }}
                      sx={{ mb: 2 }}
                      helperText="Points to be awarded by teacher when grading"
                    />
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Essay questions are manually scored by the teacher after submission.
                    </Alert>
                  </Box>
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

      {/* Success Modal */}
      <Dialog
        open={successModal}
        onClose={() => {
          setSuccessModal(false)
          router.push('/teacher/quiz')
          router.refresh()
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircle size={64} color="#4caf50" style={{ marginBottom: 16 }} />
          <Typography variant="h5" gutterBottom>
            Quiz Created Successfully!
          </Typography>
          <Typography color="text.secondary">
            Your quiz has been saved and is ready to use.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => {
              setSuccessModal(false)
              router.push('/teacher/quiz')
              router.refresh()
            }}
          >
            Go to Quizzes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}
