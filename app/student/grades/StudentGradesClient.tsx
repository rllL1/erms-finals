'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { 
  BookOpen, 
  FileText, 
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface Student {
  id: string
  student_name: string
  email: string
  student_id: string
}

interface ClassSummary {
  classId: string
  className: string
  subject: string
  teacherName: string
  quizCount: number
  quizGradedCount: number
  assignmentCount: number
  assignmentGradedCount: number
  hasExamScore: boolean
  prelimScore: number | null
  midtermScore: number | null
  finalsScore: number | null
  maxPrelimScore: number
  maxMidtermScore: number
  maxFinalsScore: number
}

interface GradeItem {
  id: string
  title: string
  score: number | null
  maxScore: number | null
  isGraded: boolean
  status: string
  submittedAt: string
  gradedAt: string | null
}

interface ExamScores {
  examName: string
  prelimScore: number | null
  midtermScore: number | null
  finalsScore: number | null
  maxPrelimScore: number
  maxMidtermScore: number
  maxFinalsScore: number
  gradedAt: string | null
}

interface ClassGrades {
  quizzes: GradeItem[]
  assignments: GradeItem[]
  exams: ExamScores | null
}

export default function StudentGradesClient({ student }: { student: Student }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [classGrades, setClassGrades] = useState<ClassGrades | null>(null)
  const [loading, setLoading] = useState(true)
  const [gradesLoading, setGradesLoading] = useState(false)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchClassGrades(selectedClassId)
    }
  }, [selectedClassId])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/grades?studentId=${student.id}`)
      const data = await response.json()

      if (response.ok) {
        setClasses(data.classes || [])
        if (data.classes?.length > 0) {
          setSelectedClassId(data.classes[0].classId)
        }
      } else {
        setError(data.error || 'Failed to fetch classes')
      }
    } catch (err) {
      setError('An error occurred while fetching classes')
    } finally {
      setLoading(false)
    }
  }

  const fetchClassGrades = async (classId: string) => {
    try {
      setGradesLoading(true)
      const response = await fetch(`/api/student/grades?studentId=${student.id}&classId=${classId}`)
      const data = await response.json()

      if (response.ok) {
        setClassGrades(data)
      } else {
        setError(data.error || 'Failed to fetch grades')
      }
    } catch (err) {
      setError('An error occurred while fetching grades')
    } finally {
      setGradesLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusChip = (status: string, isGraded: boolean) => {
    if (isGraded) {
      return (
        <Chip
          icon={<CheckCircle size={14} />}
          label="Graded"
          size="small"
          color="success"
          variant="outlined"
        />
      )
    }
    if (status === 'submitted') {
      return (
        <Chip
          icon={<Clock size={14} />}
          label="Pending"
          size="small"
          color="warning"
          variant="outlined"
        />
      )
    }
    return (
      <Chip
        icon={<AlertCircle size={14} />}
        label={status}
        size="small"
        color="default"
        variant="outlined"
      />
    )
  }

  const selectedClass = classes.find(c => c.classId === selectedClassId)

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#16a34a' }} />
      </Box>
    )
  }

  if (classes.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#16a34a', mb: 3 }}>
          My Grades
        </Typography>
        <Alert severity="info">
          You are not enrolled in any classes yet. Join a class to view your grades.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700, color: '#16a34a', mb: 3 }}>
        My Grades
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Class Selector */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Class</InputLabel>
        <Select
          value={selectedClassId}
          label="Select Class"
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          {classes.map((cls) => (
            <MenuItem key={cls.classId} value={cls.classId}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 0 : 1
              }}>
                <span>{cls.className} - {cls.subject}</span>
                {!isMobile && <span>({cls.teacherName})</span>}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Class Summary Cards */}
      {selectedClass && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
          gap: { xs: 2, sm: 3 }, 
          mb: 3 
        }}>
          <Card sx={{ height: '100%', borderTop: '4px solid #3b82f6' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ClipboardList size={isMobile ? 20 : 24} color="#3b82f6" />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Quizzes
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {selectedClass.quizGradedCount}/{selectedClass.quizCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Graded / Total Submitted
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: '100%', borderTop: '4px solid #f59e0b' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FileText size={isMobile ? 20 : 24} color="#f59e0b" />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Assignments
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {selectedClass.assignmentGradedCount}/{selectedClass.assignmentCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Graded / Total Submitted
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: '100%', borderTop: '4px solid #16a34a', gridColumn: { xs: '1', sm: 'span 2', md: 'span 1' } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BookOpen size={isMobile ? 20 : 24} color="#16a34a" />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Exams
                </Typography>
              </Box>
              {selectedClass.hasExamScore ? (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {selectedClass.prelimScore !== null && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Prelim</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a' }}>
                          {selectedClass.prelimScore}/{selectedClass.maxPrelimScore}
                        </Typography>
                      </Box>
                    )}
                    {selectedClass.midtermScore !== null && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Midterm</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a' }}>
                          {selectedClass.midtermScore}/{selectedClass.maxMidtermScore}
                        </Typography>
                      </Box>
                    )}
                    {selectedClass.finalsScore !== null && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Finals</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a' }}>
                          {selectedClass.finalsScore}/{selectedClass.maxFinalsScore}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No exam scores yet
                  </Typography>
                )}
              </CardContent>
            </Card>
        </Box>
      )}

      {/* Tabs for Detailed Grades */}
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minWidth: isMobile ? 'auto' : 120,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 },
            },
            '& .Mui-selected': {
              color: '#16a34a !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#16a34a',
            },
          }}
        >
          <Tab label={isMobile ? 'Quiz' : 'Quizzes'} icon={<ClipboardList size={16} />} iconPosition="start" />
          <Tab label={isMobile ? 'Assign' : 'Assignments'} icon={<FileText size={16} />} iconPosition="start" />
          <Tab label="Exams" icon={<BookOpen size={16} />} iconPosition="start" />
        </Tabs>

        {gradesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#16a34a' }} />
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {/* Quizzes Tab */}
            {tabValue === 0 && (
              <>
                {classGrades?.quizzes && classGrades.quizzes.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Quiz Title</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Graded</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {classGrades.quizzes.map((quiz) => (
                          <TableRow key={quiz.id} hover>
                            <TableCell>{quiz.title}</TableCell>
                            <TableCell>
                              {quiz.isGraded ? (
                                <Typography sx={{ fontWeight: 600, color: '#16a34a' }}>
                                  {quiz.score}/{quiz.maxScore}
                                </Typography>
                              ) : (
                                <Typography color="text.secondary">--</Typography>
                              )}
                            </TableCell>
                            <TableCell>{getStatusChip(quiz.status, quiz.isGraded)}</TableCell>
                            <TableCell>{formatDate(quiz.submittedAt)}</TableCell>
                            <TableCell>
                              {quiz.gradedAt ? formatDate(quiz.gradedAt) : '--'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No quiz submissions found for this class.</Alert>
                )}
              </>
            )}

            {/* Assignments Tab */}
            {tabValue === 1 && (
              <>
                {classGrades?.assignments && classGrades.assignments.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Assignment Title</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Graded</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {classGrades.assignments.map((assignment) => (
                          <TableRow key={assignment.id} hover>
                            <TableCell>{assignment.title}</TableCell>
                            <TableCell>
                              {assignment.isGraded ? (
                                <Typography sx={{ fontWeight: 600, color: '#16a34a' }}>
                                  {assignment.score}/{assignment.maxScore}
                                </Typography>
                              ) : (
                                <Typography color="text.secondary">--</Typography>
                              )}
                            </TableCell>
                            <TableCell>{getStatusChip(assignment.status, assignment.isGraded)}</TableCell>
                            <TableCell>{formatDate(assignment.submittedAt)}</TableCell>
                            <TableCell>
                              {assignment.gradedAt ? formatDate(assignment.gradedAt) : '--'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No assignment submissions found for this class.</Alert>
                )}
              </>
            )}

            {/* Exams Tab */}
            {tabValue === 2 && (
              <>
                {classGrades?.exams ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Exam Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Max Score</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {classGrades.exams.prelimScore !== null && (
                          <TableRow hover>
                            <TableCell>Prelim Exam</TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, color: '#16a34a' }}>
                                {classGrades.exams.prelimScore}
                              </Typography>
                            </TableCell>
                            <TableCell>{classGrades.exams.maxPrelimScore}</TableCell>
                            <TableCell>
                              {((classGrades.exams.prelimScore / classGrades.exams.maxPrelimScore) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        )}
                        {classGrades.exams.midtermScore !== null && (
                          <TableRow hover>
                            <TableCell>Midterm Exam</TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, color: '#16a34a' }}>
                                {classGrades.exams.midtermScore}
                              </Typography>
                            </TableCell>
                            <TableCell>{classGrades.exams.maxMidtermScore}</TableCell>
                            <TableCell>
                              {((classGrades.exams.midtermScore / classGrades.exams.maxMidtermScore) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        )}
                        {classGrades.exams.finalsScore !== null && (
                          <TableRow hover>
                            <TableCell>Finals Exam</TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, color: '#16a34a' }}>
                                {classGrades.exams.finalsScore}
                              </Typography>
                            </TableCell>
                            <TableCell>{classGrades.exams.maxFinalsScore}</TableCell>
                            <TableCell>
                              {((classGrades.exams.finalsScore / classGrades.exams.maxFinalsScore) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        )}
                        {classGrades.exams.prelimScore === null && 
                         classGrades.exams.midtermScore === null && 
                         classGrades.exams.finalsScore === null && (
                          <TableRow>
                            <TableCell colSpan={4}>
                              <Alert severity="info">No exam scores recorded yet.</Alert>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No exam scores found for this class.</Alert>
                )}
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  )
}
