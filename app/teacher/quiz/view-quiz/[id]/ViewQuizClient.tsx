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
} from '@mui/material'
import { ArrowLeft, Edit } from 'lucide-react'

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
  created_at: string
}

interface ViewQuizClientProps {
  quiz: Quiz
  questions: Question[]
}

export default function ViewQuizClient({ quiz, questions }: ViewQuizClientProps) {
  const router = useRouter()

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
          Back to Quizzes
        </Button>
        <Button
          startIcon={<Edit />}
          onClick={() => router.push(`/teacher/quiz/edit-quiz/${quiz.id}`)}
          variant="contained"
          color="primary"
        >
          Edit Quiz
        </Button>
      </Box>

      {/* Quiz Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {quiz.title}
        </Typography>
        
        {quiz.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {quiz.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          {quiz.quiz_type && (
            <Chip label={`Type: ${quiz.quiz_type}`} color="primary" />
          )}
          {quiz.time_limit && (
            <Chip label={`Time Limit: ${quiz.time_limit} minutes`} color="secondary" />
          )}
          <Chip label={`Questions: ${questions.length}`} />
          <Chip label={`Total Points: ${questions.reduce((sum, q) => sum + (q.points || 1), 0)}`} color="success" />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Start Date
            </Typography>
            <Typography variant="body1">{formatDate(quiz.start_date)}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              End Date
            </Typography>
            <Typography variant="body1">{formatDate(quiz.end_date)}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Questions */}
      <Typography variant="h5" gutterBottom>
        Questions
      </Typography>

      {questions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No questions added yet. Click Edit Quiz to add questions.
          </Typography>
        </Paper>
      ) : (
        questions.map((question, index) => (
          <Card key={question.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6">
                  Question {index + 1}
                </Typography>
                <Chip 
                  label={`${question.points || 1} ${(question.points || 1) === 1 ? 'point' : 'points'}`} 
                  size="small"
                  color="primary"
                />
              </Box>

              <Typography variant="body1" paragraph>
                {question.question}
              </Typography>

              {question.question_type === 'multiple-choice' && question.options && (
                <Box sx={{ ml: 2 }}>
                  {question.options.map((option, optIndex) => (
                    <FormControlLabel
                      key={optIndex}
                      control={
                        <Radio 
                          checked={option === question.correct_answer}
                          disabled
                        />
                      }
                      label={
                        <span>
                          {option}
                          {option === question.correct_answer && (
                            <Chip 
                              label="Correct" 
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
                    control={<Radio checked={question.correct_answer === 'true'} disabled />}
                    label={
                      <span>
                        True
                        {question.correct_answer === 'true' && (
                          <Chip label="Correct" size="small" color="success" sx={{ ml: 1 }} />
                        )}
                      </span>
                    }
                  />
                  <FormControlLabel
                    control={<Radio checked={question.correct_answer === 'false'} disabled />}
                    label={
                      <span>
                        False
                        {question.correct_answer === 'false' && (
                          <Chip label="Correct" size="small" color="success" sx={{ ml: 1 }} />
                        )}
                      </span>
                    }
                  />
                </Box>
              )}

              {question.question_type === 'short-answer' && (
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Student will provide a written answer (manually graded)
                  </Typography>
                </Box>
              )}

              {question.question_type === 'essay' && (
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Student will provide a detailed essay answer (manually graded)
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}
