'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
  Alert,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material'
import { ArrowLeft, Delete, Upload, Sparkles, Printer, Image as ImageIcon, X } from 'lucide-react'
import { generateExamPDF } from '../utils/pdfGenerator'
import NotificationModal, { type ModalSeverity } from '../components/NotificationModal'
import ConfirmationModal from '@/app/components/ConfirmationModal'
import { isDuplicateQuestion } from '../utils/duplicateDetection'

type ExamType = 'enumeration' | 'multiple-choice' | 'identification' | 'true-false' | 'essay' | 'math'
type ExamPeriod = 'prelim' | 'midterm' | 'finals'

interface ExamQuestion {
  id: string
  type: ExamType
  question: string
  options?: string[]
  correct_answer?: string
  points: number
  imageUrl?: string
  imageFile?: File
  imageUploading?: boolean
}

interface Teacher {
  id: string
  teacher_name: string
  email: string
}

interface SavedExam {
  id: string
  title: string
  period: ExamPeriod
  subject: string
  schoolName: string
  introduction: string
  questions: ExamQuestion[]
}

export default function CreateExamClient({ teacher }: { teacher: Teacher }) {
  const router = useRouter()
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai'>('manual')
  const [examTitle, setExamTitle] = useState('')
  const [examPeriod, setExamPeriod] = useState<ExamPeriod>('prelim')
  const [subject, setSubject] = useState('')
  const [schoolName, setSchoolName] = useState('St. Dominic Savio College')
  const [introduction, setIntroduction] = useState('')
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedExamTypes, setSelectedExamTypes] = useState<ExamType[]>(['multiple-choice', 'true-false'])
  const [savedExam, setSavedExam] = useState<SavedExam | null>(null)
  const [questionCounts, setQuestionCounts] = useState<Record<ExamType, number>>({
    'enumeration': 5,
    'multiple-choice': 5,
    'identification': 5,
    'true-false': 5,
    'essay': 2,
    'math': 5,
  })
  
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

  const handleAddQuestion = (type: ExamType) => {
    const newQuestion: ExamQuestion = {
      id: Date.now().toString(),
      type,
      question: '',
      options: type === 'multiple-choice' ? ['', '', '', ''] : undefined,
      points: 1,
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
      const updated = prev.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )

      // Real-time duplicate detection when question text changes
      if (field === 'question' && typeof value === 'string') {
        const questionIndex = updated.findIndex(q => q.id === id)
        const hasDuplicate = isDuplicateQuestion(value, updated, questionIndex)
        setDuplicateWarnings(prevW => ({ ...prevW, [id]: hasDuplicate }))
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

  const handleExamTypeToggle = (type: ExamType) => {
    setSelectedExamTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleGenerateAI = async () => {
    if (!uploadedFile && !aiPrompt) {
      showModal('warning', 'Please upload a file or provide a prompt.')
      return
    }

    if (selectedExamTypes.length === 0) {
      showModal('warning', 'Please select at least one exam type.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      if (uploadedFile) {
        formData.append('file', uploadedFile)
      }
      formData.append('prompt', aiPrompt)
      formData.append('examPeriod', examPeriod)
      formData.append('examTypes', JSON.stringify(selectedExamTypes))
      formData.append('questionCounts', JSON.stringify(questionCounts))
      const totalQuestions = selectedExamTypes.reduce((sum, type) => sum + questionCounts[type], 0)
      formData.append('numQuestions', totalQuestions.toString())

      const response = await fetch('/api/teacher/generate-exam', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.details || 'Failed to generate exam')
      }

      const data = await response.json()
      setQuestions(data.questions)
      setCreationMethod('manual')
      showModal('success', `Generated ${data.questions.length} exam questions successfully!`, { autoCloseMs: 3000 })
    } catch (error) {
      console.error('Error generating exam:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showModal('error', `Failed to generate exam with AI: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExam = async () => {
    if (!examTitle || questions.length === 0) {
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

    setLoading(true)
    try {
      const response = await fetch('/api/teacher/create-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          title: examTitle,
          period: examPeriod,
          subject,
          schoolName,
          introduction,
          questions,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        throw new Error(errorData.error || 'Failed to create exam')
      }

      const result = await response.json()
      const examData = {
        id: result.exam.id,
        title: examTitle,
        period: examPeriod,
        subject,
        schoolName,
        introduction,
        questions,
      }
      setSavedExam(examData)
      showModal('success', 'Your exam questions were created successfully.', {
        title: 'Exam Created Successfully!',
        actionLabel: 'OK',
        autoCloseMs: 5000,
      })
    } catch (error) {
      console.error('Error creating exam:', error)
      showModal('error', `Failed to create exam: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePrintPreview = () => {
    if (savedExam) {
      generateExamPDF(savedExam, 'print')
    }
  }

  const handleDownload = () => {
    if (savedExam) {
      generateExamPDF(savedExam, 'download')
    }
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => { router.push('/teacher/quiz'); router.refresh(); }} sx={{ mr: 2 }}>
          <ArrowLeft />
        </IconButton>
        <Typography variant="h4">Create New Exam</Typography>
      </Box>

      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Exam Title"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Exam Period</InputLabel>
            <Select
              value={examPeriod}
              label="Exam Period"
              onChange={(e) => setExamPeriod(e.target.value as ExamPeriod)}
            >
              <MenuItem value="prelim">Prelim</MenuItem>
              <MenuItem value="midterm">Midterm</MenuItem>
              <MenuItem value="finals">Finals</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField
          fullWidth
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Mathematics, Science, English"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="School Name"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          multiline
          rows={2}
          label="Introduction/Instructions"
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          placeholder="e.g., Read each question carefully and write your answer in the space provided."
          sx={{ mb: 3 }}
        />

        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
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
        </Box>

        {creationMethod === 'ai' ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Upload a PDF, PPT, or text file, or provide a topic for AI to generate exam questions.
            </Alert>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>Select Exam Types to Generate:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedExamTypes.includes('enumeration')}
                      onChange={() => handleExamTypeToggle('enumeration')}
                    />
                  }
                  label="Enumeration"
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Count"
                  value={questionCounts['enumeration']}
                  onChange={(e) => setQuestionCounts({...questionCounts, 'enumeration': parseInt(e.target.value) || 1})}
                  inputProps={{ min: 1, max: 50 }}
                  sx={{ width: 80 }}
                  disabled={!selectedExamTypes.includes('enumeration')}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedExamTypes.includes('multiple-choice')}
                      onChange={() => handleExamTypeToggle('multiple-choice')}
                    />
                  }
                  label="Multiple Choice"
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Count"
                  value={questionCounts['multiple-choice']}
                  onChange={(e) => setQuestionCounts({...questionCounts, 'multiple-choice': parseInt(e.target.value) || 1})}
                  inputProps={{ min: 1, max: 50 }}
                  sx={{ width: 80 }}
                  disabled={!selectedExamTypes.includes('multiple-choice')}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedExamTypes.includes('identification')}
                      onChange={() => handleExamTypeToggle('identification')}
                    />
                  }
                  label="Identification"
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Count"
                  value={questionCounts['identification']}
                  onChange={(e) => setQuestionCounts({...questionCounts, 'identification': parseInt(e.target.value) || 1})}
                  inputProps={{ min: 1, max: 50 }}
                  sx={{ width: 80 }}
                  disabled={!selectedExamTypes.includes('identification')}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedExamTypes.includes('true-false')}
                      onChange={() => handleExamTypeToggle('true-false')}
                    />
                  }
                  label="True/False"
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Count"
                  value={questionCounts['true-false']}
                  onChange={(e) => setQuestionCounts({...questionCounts, 'true-false': parseInt(e.target.value) || 1})}
                  inputProps={{ min: 1, max: 50 }}
                  sx={{ width: 80 }}
                  disabled={!selectedExamTypes.includes('true-false')}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedExamTypes.includes('essay')}
                      onChange={() => handleExamTypeToggle('essay')}
                    />
                  }
                  label="Essay"
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Count"
                  value={questionCounts['essay']}
                  onChange={(e) => setQuestionCounts({...questionCounts, 'essay': parseInt(e.target.value) || 1})}
                  inputProps={{ min: 1, max: 50 }}
                  sx={{ width: 80 }}
                  disabled={!selectedExamTypes.includes('essay')}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedExamTypes.includes('math')}
                      onChange={() => handleExamTypeToggle('math')}
                    />
                  }
                  label="Question"
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Count"
                  value={questionCounts['math']}
                  onChange={(e) => setQuestionCounts({...questionCounts, 'math': parseInt(e.target.value) || 1})}
                  inputProps={{ min: 1, max: 50 }}
                  sx={{ width: 80 }}
                  disabled={!selectedExamTypes.includes('math')}
                />
              </Box>
            </Box>
            
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
              placeholder="e.g., Generate exam questions about Philippine History"
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
          </Box>
        ) : (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Add Questions</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddQuestion('enumeration')}
                >
                  Enumeration
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddQuestion('multiple-choice')}
                >
                  Multiple Choice
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddQuestion('identification')}
                >
                  Identification
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddQuestion('true-false')}
                >
                  True/False
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddQuestion('essay')}
                >
                  Essay
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => handleAddQuestion('math')}
                >
                  Question
                </Button>
              </Box>
            </Box>

            {questions.map((question, index) => (
              <Card key={question.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1">
                    {question.type === 'math' ? `Question ${index + 1}` : `Question ${index + 1} - ${question.type.replace('-', ' ').toUpperCase()}`}
                  </Typography>
                  <Box>
                    <TextField
                      size="small"
                      type="number"
                      label="Points"
                      value={question.points}
                      onChange={(e) => handleQuestionChange(question.id, 'points', parseInt(e.target.value))}
                      sx={{ width: 80, mr: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

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

                {question.type === 'math' && (
                  <TextField
                    fullWidth
                    label="Correct Answer"
                    value={question.correct_answer || ''}
                    onChange={(e) => handleQuestionChange(question.id, 'correct_answer', e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder="Enter the correct answer"
                  />
                )}

                {question.type === 'multiple-choice' && question.options && (
                  <Box>
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
                  </Box>
                )}
              </Card>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => { router.push('/teacher/quiz'); router.refresh(); }}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveExam}
            disabled={loading || !examTitle || questions.length === 0 || Object.values(duplicateWarnings).some(Boolean)}
            fullWidth
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Exam'}
          </Button>
        </Box>

        {savedExam && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Alert severity="success" sx={{ flex: 1 }}>
              Exam saved successfully!
            </Alert>
            <Button
              variant="outlined"
              startIcon={<Printer />}
              onClick={handlePrintPreview}
            >
              Print Preview
            </Button>
            <Button
              variant="contained"
              onClick={handleDownload}
            >
              Download PDF
            </Button>
            <Button
              variant="outlined"
              onClick={() => { router.push('/teacher/quiz'); router.refresh(); }}
            >
              Back to Quizzes
            </Button>
          </Box>
        )}
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
