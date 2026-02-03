'use client'

import { useState } from 'react'
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
  Grid,
  Typography,
  IconButton,
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material'
import { ArrowLeft, Delete, Upload, Sparkles, Printer, Calculator } from 'lucide-react'
import { generateExamPDF } from '../utils/pdfGenerator'

type ExamType = 'enumeration' | 'multiple-choice' | 'identification' | 'true-false' | 'essay' | 'math'
type ExamPeriod = 'prelim' | 'midterm' | 'finals'

interface ExamQuestion {
  id: string
  type: ExamType
  question: string
  options?: string[]
  points: number
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
  const [numQuestions, setNumQuestions] = useState(20)

  const handleAddQuestion = (type: ExamType) => {
    const newQuestion: ExamQuestion = {
      id: Date.now().toString(),
      type,
      question: '',
      options: type === 'multiple-choice' ? ['', '', '', ''] : undefined,
      points: 1,
    }
    setQuestions([...questions, newQuestion])
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleQuestionChange = (id: string, field: string, value: string | number) => {
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

  const handleExamTypeToggle = (type: ExamType) => {
    setSelectedExamTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleGenerateAI = async () => {
    if (!uploadedFile && !aiPrompt) {
      alert('Please upload a file or provide a prompt')
      return
    }

    if (selectedExamTypes.length === 0) {
      alert('Please select at least one exam type')
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
      formData.append('numQuestions', numQuestions.toString())

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
    } catch (error) {
      console.error('Error generating exam:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to generate exam with AI: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExam = async () => {
    if (!examTitle || questions.length === 0) {
      alert('Please provide a title and at least one question')
      return
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
      alert('Exam created successfully! You can now print or preview the exam.')
    } catch (error) {
      console.error('Error creating exam:', error)
      alert(`Failed to create exam: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
            <FormGroup row sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedExamTypes.includes('enumeration')}
                    onChange={() => handleExamTypeToggle('enumeration')}
                  />
                }
                label="Enumeration"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedExamTypes.includes('multiple-choice')}
                    onChange={() => handleExamTypeToggle('multiple-choice')}
                  />
                }
                label="Multiple Choice"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedExamTypes.includes('identification')}
                    onChange={() => handleExamTypeToggle('identification')}
                  />
                }
                label="Identification"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedExamTypes.includes('true-false')}
                    onChange={() => handleExamTypeToggle('true-false')}
                  />
                }
                label="True/False"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedExamTypes.includes('essay')}
                    onChange={() => handleExamTypeToggle('essay')}
                  />
                }
                label="Essay"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedExamTypes.includes('math')}
                    onChange={() => handleExamTypeToggle('math')}
                  />
                }
                label="Math Problem"
              />
            </FormGroup>

            <TextField
              fullWidth
              type="number"
              label="Number of Questions to Generate"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value) || 20)}
              inputProps={{ min: 1, max: 200 }}
              helperText="Specify how many questions to generate (1-200)"
              sx={{ mb: 2 }}
            />
            
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
                  startIcon={<Calculator size={16} />}
                  onClick={() => handleAddQuestion('math')}
                >
                  Questions
                </Button>
              </Box>
            </Box>

            {questions.map((question, index) => (
              <Card key={question.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Question {index + 1} - {question.type.replace('-', ' ').toUpperCase()}
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
            disabled={loading || !examTitle || questions.length === 0}
            fullWidth
          >
            Save Exam
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
    </Box>
  )
}
