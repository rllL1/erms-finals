'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  BookOpen,
  FileText,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  BarChart3,
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
  quizAverage: number | null
  assignmentAverage: number | null
  prelimScore: number | null
  midtermScore: number | null
  finalsScore: number | null
  maxPrelimScore: number
  maxMidtermScore: number
  maxFinalsScore: number
  termGrades: { prelim: number | null; midterm: number | null; finals: number | null }
  finalGrade: number | null
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
  prelimScore: number | null
  midtermScore: number | null
  finalsScore: number | null
  maxPrelimScore: number
  maxMidtermScore: number
  maxFinalsScore: number
  portfolioScore: number | null
  gradedAt: string | null
}

interface ClassGrades {
  quizzes: GradeItem[]
  assignments: GradeItem[]
  quizAverage: number | null
  assignmentAverage: number | null
  exams: ExamScores | null
  termGrades: { prelim: number | null; midterm: number | null; finals: number | null }
  finalGrade: number | null
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

  const fetchClassGrades = useCallback(async (classId: string) => {
    try {
      setGradesLoading(true)
      const response = await fetch(`/api/student/grades?studentId=${student.id}&classId=${classId}`)
      const data = await response.json()

      if (response.ok) {
        setClassGrades(data)
      } else {
        setError(data.error || 'Failed to fetch grades')
      }
    } catch {
      setError('An error occurred while fetching grades')
    } finally {
      setGradesLoading(false)
    }
  }, [student.id])

  useEffect(() => {
    setMounted(true)
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
      } catch {
        setError('An error occurred while fetching classes')
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [student.id])

  useEffect(() => {
    if (selectedClassId) {
      fetchClassGrades(selectedClassId)
    }
  }, [selectedClassId, fetchClassGrades])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!selectedClassId) return
    const interval = setInterval(() => {
      fetchClassGrades(selectedClassId)
    }, 30000)
    return () => clearInterval(interval)
  }, [selectedClassId, fetchClassGrades])

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

  const formatScore = (score: number | null): string => {
    if (score === null || score === undefined) return '—'
    return score.toFixed(1)
  }

  const getGradeColor = (pct: number | null): string => {
    if (pct === null) return 'text.secondary'
    if (pct >= 90) return '#16a34a'
    if (pct >= 80) return '#2563eb'
    if (pct >= 70) return '#f59e0b'
    return '#ef4444'
  }

  const selectedClass = classes.find((c) => c.classId === selectedClassId)

  if (!mounted) return null

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

      {/* ───── OVERVIEW TABLE: All Classes ───── */}
      <Paper sx={{ mb: 4, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, bgcolor: '#f0fdf4', borderBottom: '2px solid #16a34a' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart3 size={20} color="#16a34a" />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#15803d' }}>
              Grades Overview
            </Typography>
          </Box>
        </Box>
        <TableContainer>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>}
                <TableCell align="center" sx={{ fontWeight: 700 }}>Quiz Avg</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Assignment Avg</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Prelim</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Midterm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Finals</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#16a34a' }}>
                  Final Grade
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((cls) => {
                const hasAnyGrade =
                  cls.quizAverage !== null ||
                  cls.assignmentAverage !== null ||
                  cls.prelimScore !== null ||
                  cls.midtermScore !== null ||
                  cls.finalsScore !== null ||
                  cls.finalGrade !== null

                return (
                  <TableRow
                    key={cls.classId}
                    hover
                    selected={cls.classId === selectedClassId}
                    onClick={() => setSelectedClassId(cls.classId)}
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': { bgcolor: '#f0fdf4' },
                      '&.Mui-selected:hover': { bgcolor: '#dcfce7' },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{cls.subject || cls.className}</TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {cls.className}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      {cls.quizAverage !== null ? (
                        <Typography sx={{ fontWeight: 600, color: getGradeColor(cls.quizAverage) }}>
                          {cls.quizAverage.toFixed(1)}%
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {cls.assignmentAverage !== null ? (
                        <Typography sx={{ fontWeight: 600, color: getGradeColor(cls.assignmentAverage) }}>
                          {cls.assignmentAverage.toFixed(1)}%
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {cls.prelimScore !== null ? (
                        <Typography sx={{ fontWeight: 600, color: getGradeColor((cls.prelimScore / cls.maxPrelimScore) * 100) }}>
                          {cls.prelimScore}/{cls.maxPrelimScore}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {cls.midtermScore !== null ? (
                        <Typography sx={{ fontWeight: 600, color: getGradeColor((cls.midtermScore / cls.maxMidtermScore) * 100) }}>
                          {cls.midtermScore}/{cls.maxMidtermScore}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {cls.finalsScore !== null ? (
                        <Typography sx={{ fontWeight: 600, color: getGradeColor((cls.finalsScore / cls.maxFinalsScore) * 100) }}>
                          {cls.finalsScore}/{cls.maxFinalsScore}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {cls.finalGrade !== null ? (
                        <Chip
                          label={`${cls.finalGrade.toFixed(2)}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: cls.finalGrade >= 75 ? '#dcfce7' : '#fef2f2',
                            color: cls.finalGrade >= 75 ? '#15803d' : '#dc2626',
                            border: `1px solid ${cls.finalGrade >= 75 ? '#86efac' : '#fca5a5'}`,
                          }}
                        />
                      ) : hasAnyGrade ? (
                        <Typography variant="caption" color="text.disabled">
                          Pending
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {classes.every(
                (cls) =>
                  cls.quizAverage === null &&
                  cls.assignmentAverage === null &&
                  cls.prelimScore === null &&
                  cls.midtermScore === null &&
                  cls.finalsScore === null &&
                  cls.finalGrade === null
              ) && (
                <TableRow>
                  <TableCell colSpan={isMobile ? 7 : 8}>
                    <Alert severity="info" sx={{ border: 'none' }}>
                      No grades available yet. Grades will appear here once your teachers record them.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ───── DETAILED VIEW for selected class ───── */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Class for Details</InputLabel>
        <Select
          value={selectedClassId}
          label="Select Class for Details"
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          {classes.map((cls) => (
            <MenuItem key={cls.classId} value={cls.classId}>
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0 : 1 }}>
                <span>
                  {cls.className} — {cls.subject}
                </span>
                {!isMobile && (
                  <span style={{ color: '#6b7280' }}>({cls.teacherName})</span>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedClass && (
        <>
          {/* ── Summary Cards ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Quiz Average */}
            <Card sx={{ borderTop: '4px solid #3b82f6' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <ClipboardList size={16} color="#3b82f6" />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b82f6' }}>
                    Quiz Avg
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: getGradeColor(classGrades?.quizAverage ?? null) }}>
                  {classGrades?.quizAverage !== null && classGrades?.quizAverage !== undefined
                    ? `${classGrades.quizAverage.toFixed(1)}%`
                    : '—'}
                </Typography>
              </CardContent>
            </Card>

            {/* Assignment Average */}
            <Card sx={{ borderTop: '4px solid #f59e0b' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <FileText size={16} color="#f59e0b" />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#f59e0b' }}>
                    Assignment Avg
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: getGradeColor(classGrades?.assignmentAverage ?? null) }}>
                  {classGrades?.assignmentAverage !== null && classGrades?.assignmentAverage !== undefined
                    ? `${classGrades.assignmentAverage.toFixed(1)}%`
                    : '—'}
                </Typography>
              </CardContent>
            </Card>

            {/* Exam Scores */}
            <Card sx={{ borderTop: '4px solid #8b5cf6' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <BookOpen size={16} color="#8b5cf6" />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#8b5cf6' }}>
                    Exams
                  </Typography>
                </Box>
                {classGrades?.exams &&
                (classGrades.exams.prelimScore !== null ||
                  classGrades.exams.midtermScore !== null ||
                  classGrades.exams.finalsScore !== null) ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {classGrades.exams.prelimScore !== null && (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        P: {classGrades.exams.prelimScore}
                      </Typography>
                    )}
                    {classGrades.exams.midtermScore !== null && (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        M: {classGrades.exams.midtermScore}
                      </Typography>
                    )}
                    {classGrades.exams.finalsScore !== null && (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        F: {classGrades.exams.finalsScore}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    No scores yet
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Final Grade */}
            <Card
              sx={{
                borderTop: `4px solid ${
                  classGrades?.finalGrade !== null && classGrades?.finalGrade !== undefined
                    ? classGrades.finalGrade >= 75
                      ? '#16a34a'
                      : '#ef4444'
                    : '#9ca3af'
                }`,
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <Award size={16} color="#16a34a" />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#16a34a' }}>
                    Final Grade
                  </Typography>
                </Box>
                {classGrades?.finalGrade !== null && classGrades?.finalGrade !== undefined ? (
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: classGrades.finalGrade >= 75 ? '#16a34a' : '#ef4444',
                    }}
                  >
                    {classGrades.finalGrade.toFixed(2)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    Not yet available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* ── Tabbed Detail Section ── */}
          <Paper sx={{ mb: 3, overflow: 'hidden' }}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
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
                '& .Mui-selected': { color: '#16a34a !important' },
                '& .MuiTabs-indicator': { backgroundColor: '#16a34a' },
              }}
            >
              <Tab label={isMobile ? 'Quiz' : 'Quizzes'} icon={<ClipboardList size={16} />} iconPosition="start" />
              <Tab label={isMobile ? 'Assign' : 'Assignments'} icon={<FileText size={16} />} iconPosition="start" />
              <Tab label="Exams" icon={<BookOpen size={16} />} iconPosition="start" />
              <Tab label={isMobile ? 'Final' : 'Final Grade'} icon={<Award size={16} />} iconPosition="start" />
            </Tabs>

            {gradesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#16a34a' }} />
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                {/* ── QUIZZES TAB ── */}
                {tabValue === 0 && (
                  <>
                    {classGrades?.quizzes && classGrades.quizzes.length > 0 ? (
                      <>
                        <TableContainer>
                          <Table size={isMobile ? 'small' : 'medium'}>
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Quiz Title</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Score</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {classGrades.quizzes.map((quiz) => (
                                <TableRow key={quiz.id} hover>
                                  <TableCell>{quiz.title}</TableCell>
                                  <TableCell align="center">
                                    {quiz.isGraded && quiz.score !== null ? (
                                      <Typography sx={{ fontWeight: 600, color: '#16a34a' }}>
                                        {quiz.score}/{quiz.maxScore}
                                      </Typography>
                                    ) : (
                                      <Typography color="text.disabled">—</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center">
                                    {quiz.isGraded && quiz.score !== null && quiz.maxScore ? (
                                      <Typography
                                        sx={{
                                          fontWeight: 600,
                                          color: getGradeColor((quiz.score / quiz.maxScore) * 100),
                                        }}
                                      >
                                        {((quiz.score / quiz.maxScore) * 100).toFixed(1)}%
                                      </Typography>
                                    ) : (
                                      <Typography color="text.disabled">—</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center">{getStatusChip(quiz.status, quiz.isGraded)}</TableCell>
                                  {!isMobile && <TableCell>{formatDate(quiz.submittedAt)}</TableCell>}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {classGrades.quizAverage !== null && (
                          <Box sx={{ px: 2, py: 1.5, bgcolor: '#f0fdf4', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Quiz Average:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: getGradeColor(classGrades.quizAverage) }}>
                              {classGrades.quizAverage.toFixed(1)}%
                            </Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Alert severity="info">No quiz submissions found for this class.</Alert>
                    )}
                  </>
                )}

                {/* ── ASSIGNMENTS TAB ── */}
                {tabValue === 1 && (
                  <>
                    {classGrades?.assignments && classGrades.assignments.length > 0 ? (
                      <>
                        <TableContainer>
                          <Table size={isMobile ? 'small' : 'medium'}>
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Assignment Title</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Score</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {classGrades.assignments.map((assignment) => (
                                <TableRow key={assignment.id} hover>
                                  <TableCell>{assignment.title}</TableCell>
                                  <TableCell align="center">
                                    {assignment.isGraded && assignment.score !== null ? (
                                      <Typography sx={{ fontWeight: 600, color: '#16a34a' }}>
                                        {assignment.score}/{assignment.maxScore}
                                      </Typography>
                                    ) : (
                                      <Typography color="text.disabled">—</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center">
                                    {assignment.isGraded && assignment.score !== null && assignment.maxScore ? (
                                      <Typography
                                        sx={{
                                          fontWeight: 600,
                                          color: getGradeColor((assignment.score / assignment.maxScore) * 100),
                                        }}
                                      >
                                        {((assignment.score / assignment.maxScore) * 100).toFixed(1)}%
                                      </Typography>
                                    ) : (
                                      <Typography color="text.disabled">—</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center">{getStatusChip(assignment.status, assignment.isGraded)}</TableCell>
                                  {!isMobile && <TableCell>{formatDate(assignment.submittedAt)}</TableCell>}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {classGrades.assignmentAverage !== null && (
                          <Box sx={{ px: 2, py: 1.5, bgcolor: '#fffbeb', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Assignment Average:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: getGradeColor(classGrades.assignmentAverage) }}>
                              {classGrades.assignmentAverage.toFixed(1)}%
                            </Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Alert severity="info">No assignment submissions found for this class.</Alert>
                    )}
                  </>
                )}

                {/* ── EXAMS TAB ── */}
                {tabValue === 2 && (
                  <>
                    {classGrades?.exams &&
                    (classGrades.exams.prelimScore !== null ||
                      classGrades.exams.midtermScore !== null ||
                      classGrades.exams.finalsScore !== null) ? (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                              <TableCell sx={{ fontWeight: 700 }}>Grading Period</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>Score</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>Max Score</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>Percentage</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>Term Grade</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {/* Prelim */}
                            {classGrades.exams.prelimScore !== null && (
                              <TableRow hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="Prelim" size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 600 }} />
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography sx={{ fontWeight: 600 }}>{classGrades.exams.prelimScore}</Typography>
                                </TableCell>
                                <TableCell align="center">{classGrades.exams.maxPrelimScore}</TableCell>
                                <TableCell align="center">
                                  <Typography
                                    sx={{
                                      fontWeight: 600,
                                      color: getGradeColor(
                                        (classGrades.exams.prelimScore / classGrades.exams.maxPrelimScore) * 100
                                      ),
                                    }}
                                  >
                                    {((classGrades.exams.prelimScore / classGrades.exams.maxPrelimScore) * 100).toFixed(1)}%
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  {classGrades.termGrades?.prelim !== null ? (
                                    <Typography sx={{ fontWeight: 700, color: getGradeColor(classGrades.termGrades.prelim) }}>
                                      {formatScore(classGrades.termGrades.prelim)}
                                    </Typography>
                                  ) : (
                                    <Typography color="text.disabled">—</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                            {/* Midterm */}
                            {classGrades.exams.midtermScore !== null && (
                              <TableRow hover>
                                <TableCell>
                                  <Chip label="Midterm" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600 }} />
                                </TableCell>
                                <TableCell align="center">
                                  <Typography sx={{ fontWeight: 600 }}>{classGrades.exams.midtermScore}</Typography>
                                </TableCell>
                                <TableCell align="center">{classGrades.exams.maxMidtermScore}</TableCell>
                                <TableCell align="center">
                                  <Typography
                                    sx={{
                                      fontWeight: 600,
                                      color: getGradeColor(
                                        (classGrades.exams.midtermScore / classGrades.exams.maxMidtermScore) * 100
                                      ),
                                    }}
                                  >
                                    {((classGrades.exams.midtermScore / classGrades.exams.maxMidtermScore) * 100).toFixed(1)}%
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  {classGrades.termGrades?.midterm !== null ? (
                                    <Typography sx={{ fontWeight: 700, color: getGradeColor(classGrades.termGrades.midterm) }}>
                                      {formatScore(classGrades.termGrades.midterm)}
                                    </Typography>
                                  ) : (
                                    <Typography color="text.disabled">—</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                            {/* Finals */}
                            {classGrades.exams.finalsScore !== null && (
                              <TableRow hover>
                                <TableCell>
                                  <Chip label="Finals" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600 }} />
                                </TableCell>
                                <TableCell align="center">
                                  <Typography sx={{ fontWeight: 600 }}>{classGrades.exams.finalsScore}</Typography>
                                </TableCell>
                                <TableCell align="center">{classGrades.exams.maxFinalsScore}</TableCell>
                                <TableCell align="center">
                                  <Typography
                                    sx={{
                                      fontWeight: 600,
                                      color: getGradeColor(
                                        (classGrades.exams.finalsScore / classGrades.exams.maxFinalsScore) * 100
                                      ),
                                    }}
                                  >
                                    {((classGrades.exams.finalsScore / classGrades.exams.maxFinalsScore) * 100).toFixed(1)}%
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  {classGrades.termGrades?.finals !== null ? (
                                    <Typography sx={{ fontWeight: 700, color: getGradeColor(classGrades.termGrades.finals) }}>
                                      {formatScore(classGrades.termGrades.finals)}
                                    </Typography>
                                  ) : (
                                    <Typography color="text.disabled">—</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                            {/* No scores row */}
                            {classGrades.exams.prelimScore === null &&
                              classGrades.exams.midtermScore === null &&
                              classGrades.exams.finalsScore === null && (
                                <TableRow>
                                  <TableCell colSpan={5}>
                                    <Alert severity="info">No exam scores recorded yet.</Alert>
                                  </TableCell>
                                </TableRow>
                              )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info">
                        No exam scores available yet. Scores will appear here once your teacher records them.
                      </Alert>
                    )}
                  </>
                )}

                {/* ── FINAL GRADE TAB ── */}
                {tabValue === 3 && (
                  <Box sx={{ p: { xs: 1, sm: 2 } }}>
                    {classGrades?.finalGrade !== null && classGrades?.finalGrade !== undefined ? (
                      <Card
                        sx={{
                          maxWidth: 500,
                          mx: 'auto',
                          border: `2px solid ${classGrades.finalGrade >= 75 ? '#16a34a' : '#ef4444'}`,
                          borderRadius: 3,
                        }}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                          <Award size={48} color={classGrades.finalGrade >= 75 ? '#16a34a' : '#ef4444'} />
                          <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                            Final Grade
                          </Typography>
                          <Typography
                            variant="h2"
                            sx={{
                              fontWeight: 800,
                              color: classGrades.finalGrade >= 75 ? '#16a34a' : '#ef4444',
                              mb: 2,
                            }}
                          >
                            {classGrades.finalGrade.toFixed(2)}
                          </Typography>
                          <Chip
                            label={classGrades.finalGrade >= 75 ? 'PASSED' : 'FAILED'}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              px: 2,
                              py: 0.5,
                              bgcolor: classGrades.finalGrade >= 75 ? '#dcfce7' : '#fef2f2',
                              color: classGrades.finalGrade >= 75 ? '#15803d' : '#dc2626',
                            }}
                          />
                          <Divider sx={{ my: 3 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Grade Breakdown
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Prelim</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {formatScore(classGrades.termGrades?.prelim ?? null)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Midterm</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {formatScore(classGrades.termGrades?.midterm ?? null)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Finals</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {formatScore(classGrades.termGrades?.finals ?? null)}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            Formula: ((Prelim + Midterm) / 2 + Finals) / 2
                          </Typography>
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto' }}>
                        Your final grade is not yet available. It will appear here once your teacher has recorded grades for all grading periods (Prelim, Midterm, and Finals).
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  )
}
