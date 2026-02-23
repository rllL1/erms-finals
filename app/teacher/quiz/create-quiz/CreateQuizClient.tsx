'use client'

import { useState, useCallback } from 'react'
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
  CircularProgress,
} from '@mui/material'
import { ArrowLeft, Delete, Upload, Sparkles, Image as ImageIcon, X } from 'lucide-react'
import NotificationModal, { type ModalSeverity } from '../components/NotificationModal'
import ConfirmationModal from '@/app/components/ConfirmationModal'
import { isDuplicateQuestion } from '../utils/duplicateDetection'

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
      showModal('error', 'Invalid file type. Only JPG and PNG are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      showModal('error', 'File too large. Maximum size is 5MB.')
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
        showModal('success', 'Image uploaded successfully.', { autoCloseMs: 2000 })
      } else {
        throw new Error(data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, imageUploading: false } : q
      ))
      showModal('error', `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleRemoveImage = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, imageUrl: undefined, imageFile: undefined } : q
    ))
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

  const handleQuestionChange = (id: string, field: string, value: string | number) => {
    setQuestions(prev => {
      const updated = prev.map(q => {
        if (q.id === id) {
          if (field === 'points') {
            return { ...q, [field]: parseInt(String(value)) || 1 }
          }
          return { ...q, [field]: value }
        }
        return q
      })

      // Real-time duplicate detection when question text changes
      if (field === 'question' && typeof value === 'string') {
        const questionIndex = updated.findIndex(q => q.id === id)
        const hasDuplicate = isDuplicateQuestion(value, updated, questionIndex)
        setDuplicateWarnings(prev => ({ ...prev, [id]: hasDuplicate }))
      }

      return updated
    })
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
      showModal('warning', 'Please upload a file or provide a prompt.')
      return
    }

    const totalQuestions = multipleChoiceCount + trueFalseCount + identificationCount
    if (totalQuestions === 0) {
      showModal('warning', 'Please specify at least one question to generate.')
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
      setCreationMethod('manual')
      showModal('success', `Generated ${questionsWithIds.length} questions successfully!`, { autoCloseMs: 3000 })
    } catch (error) {
      console.error('Error generating quiz:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showModal('error', `Failed to generate quiz with AI: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuiz = async () => {
    if (!quizTitle || questions.length === 0) {
      showModal('warning', 'Please provide a title and at least one question.')
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

    console.log('Saving quiz with teacher:', teacher)
    console.log('Teacher ID:', teacher?.id)

    if (!teacher || !teacher.id) {
      showModal('error', 'Teacher information is missing. Please refresh the page and try again.')
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

      showModal('success', 'Your quiz questions were created successfully.', {
        title: 'Quiz Created Successfully!',
        actionLabel: 'Go to Quizzes',
        onAction: () => {
          closeModal()
          router.push('/teacher/quiz')
          router.refresh()
        },
        autoCloseMs: 5000,
      })
    } catch (error) {
      console.error('Error creating quiz:', error)
      showModal('error', `Failed to create quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
                  sx={{ mb: duplicateWarnings[question.id] ? 0 : 2 }}
                  error={duplicateWarnings[question.id]}
                  helperText={duplicateWarnings[question.id] ? 'Duplicate question detected — this question already exists.' : ''}
                />
                {duplicateWarnings[question.id] && (
                  <Alert severity="error" sx={{ mb: 2, mt: 0.5 }}>
                    This question already exists. Duplicate questions are not allowed.
                  </Alert>
                )}

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
            disabled={loading || !quizTitle || questions.length === 0 || Object.values(duplicateWarnings).some(Boolean)}
            fullWidth
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Quiz'}
          </Button>
        </div>
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
    </div>
  )
}
