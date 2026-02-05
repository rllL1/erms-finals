'use client'

import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Radio,
  TextField,
} from '@mui/material'
import { ArrowLeft, Edit, Download, Printer } from 'lucide-react'
import { generateExamPDF } from '../../utils/pdfGenerator'

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
  created_at: string
}

interface ViewExamClientProps {
  exam: Exam
  questions: Question[]
}

export default function ViewExamClient({ exam, questions }: ViewExamClientProps) {
  const router = useRouter()

  const getPeriodColor = (period: string) => {
    switch (period) {
      case 'prelim': return 'info'
      case 'midterm': return 'warning'
      case 'finals': return 'error'
      default: return 'default'
    }
  }

  const handlePrintPreview = () => {
    const examData = {
      id: exam.id,
      title: exam.title,
      period: exam.period || 'general',
      schoolName: exam.school_name || 'School Name',
      introduction: exam.introduction || '',
      questions: questions.map(q => ({
        id: q.id,
        type: q.question_type,
        question: q.question,
        options: q.options,
        points: q.points || 1,
      }))
    }
    generateExamPDF(examData, 'print')
  }

  const handleDownloadPDF = () => {
    const examData = {
      id: exam.id,
      title: exam.title,
      period: exam.period || 'general',
      schoolName: exam.school_name || 'School Name',
      introduction: exam.introduction || '',
      questions: questions.map(q => ({
        id: q.id,
        type: q.question_type,
        question: q.question,
        options: q.options,
        points: q.points || 1,
      }))
    }
    generateExamPDF(examData, 'download')
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => router.push('/teacher/quiz')}
          variant="outlined"
        >
          Back to Exams
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<Printer />}
            onClick={handlePrintPreview}
            variant="outlined"
            color="secondary"
          >
            Print Preview
          </Button>
          <Button
            startIcon={<Download />}
            onClick={handleDownloadPDF}
            variant="outlined"
            color="success"
          >
            Download PDF
          </Button>
          <Button
            startIcon={<Edit />}
            onClick={() => router.push(`/teacher/quiz/edit-exam/${exam.id}`)}
            variant="contained"
            color="primary"
          >
            Edit Exam
          </Button>
        </Box>
      </Box>

      {/* Exam Header */}
      <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {exam.school_name || 'School Name'}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {exam.title}
        </Typography>
        {exam.period && (
          <Chip 
            label={exam.period.toUpperCase() + ' EXAMINATION'} 
            color={getPeriodColor(exam.period)}
            sx={{ mt: 1 }}
          />
        )}
      </Paper>

      {/* Exam Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {exam.introduction && (
          <>
            <Typography variant="h6" gutterBottom>
              Instructions
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {exam.introduction}
            </Typography>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`Questions: ${questions.length}`} />
          <Chip label={`Total Points: ${questions.reduce((sum, q) => sum + (q.points || 1), 0)}`} color="success" />
          <Chip 
            label={exam.show_answer_key ? 'Answer Key: Visible' : 'Answer Key: Hidden'} 
            color={exam.show_answer_key ? 'success' : 'default'}
          />
        </Box>
      </Paper>

      {/* Questions */}
      <Typography variant="h5" gutterBottom>
        Examination Questions
      </Typography>

      {questions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No questions added yet. Click Edit Exam to add questions.
          </Typography>
        </Paper>
      ) : (
        questions.map((question, index) => (
          <Card key={question.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6">
                  {index + 1}. {question.question}
                </Typography>
                <Chip 
                  label={`${question.points || 1} ${(question.points || 1) === 1 ? 'pt' : 'pts'}`} 
                  size="small"
                  color="primary"
                />
              </Box>

              {question.question_type === 'multiple-choice' && question.options && (
                <Box sx={{ ml: 2 }}>
                  {question.options.map((option, optIndex) => (
                    <FormControlLabel
                      key={optIndex}
                      control={
                        <Radio 
                          checked={exam.show_answer_key && option === question.correct_answer}
                          disabled
                        />
                      }
                      label={
                        <span>
                          {String.fromCharCode(65 + optIndex)}. {option}
                          {exam.show_answer_key && option === question.correct_answer && (
                            <Chip 
                              label="Correct Answer" 
                              size="small" 
                              color="success" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </span>
                      }
                    />
                  ))}
                </Box>
              )}

              {question.question_type === 'true-false' && (
                <Box sx={{ ml: 2 }}>
                  <FormControlLabel
                    control={
                      <Radio 
                        checked={exam.show_answer_key && question.correct_answer === 'true'} 
                        disabled 
                      />
                    }
                    label={
                      <span>
                        True
                        {exam.show_answer_key && question.correct_answer === 'true' && (
                          <Chip label="Correct Answer" size="small" color="success" sx={{ ml: 1 }} />
                        )}
                      </span>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Radio 
                        checked={exam.show_answer_key && question.correct_answer === 'false'} 
                        disabled 
                      />
                    }
                    label={
                      <span>
                        False
                        {exam.show_answer_key && question.correct_answer === 'false' && (
                          <Chip label="Correct Answer" size="small" color="success" sx={{ ml: 1 }} />
                        )}
                      </span>
                    }
                  />
                </Box>
              )}

              {question.question_type === 'short-answer' && (
                <Box sx={{ ml: 2, mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Student answer will appear here..."
                    disabled
                    variant="outlined"
                  />
                  {exam.show_answer_key && question.correct_answer && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Sample Answer: {question.correct_answer}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {question.question_type === 'essay' && (
                <Box sx={{ ml: 2, mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Student essay answer will appear here..."
                    disabled
                    variant="outlined"
                  />
                  {exam.show_answer_key && question.correct_answer && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Grading Rubric/Key Points:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {question.correct_answer}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}
