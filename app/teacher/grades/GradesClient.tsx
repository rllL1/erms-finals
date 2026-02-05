'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField, 
  Button, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material'
import { Settings, Save, Edit2, RefreshCw, X } from 'lucide-react'

interface GradesClientProps {
  teacherId: string
  classes: {
    id: string
    class_name: string
    subject: string
    class_code: string
  }[]
}

interface StudentGrade {
  enrollment_id: string
  student_id: string
  student_number: string
  student_name: string
  quiz_average: number
  assignment_average: number
  exam_percentage: number
  raw_exam_score: number | null
  max_exam_score: number
  prelim_score: number | null
  midterm_score: number | null
  finals_score: number | null
  overall_grade: number
  quiz_weight: number
  assignment_weight: number
  exam_weight: number
}

interface ComputationSettings {
  quiz_percentage: number
  assignment_percentage: number
  exam_percentage: number
}

export default function GradesClient({ teacherId, classes }: GradesClientProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [students, setStudents] = useState<StudentGrade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<ComputationSettings>({
    quiz_percentage: 30,
    assignment_percentage: 30,
    exam_percentage: 40
  })
  
  // Edit mode for exam scores
  const [editingExam, setEditingExam] = useState<{ [key: string]: boolean }>({})
  const [prelimScores, setPrelimScores] = useState<{ [key: string]: string }>({})
  const [midtermScores, setMidtermScores] = useState<{ [key: string]: string }>({})
  const [finalsScores, setFinalsScores] = useState<{ [key: string]: string }>({})
  const [examScores, setExamScores] = useState<{ [key: string]: string }>({}) // Legacy

  // Fetch students and grades when class is selected
  useEffect(() => {
    if (selectedClassId) {
      fetchGrades()
    }
  }, [selectedClassId])

  const fetchGrades = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/teacher/grades/${selectedClassId}`)
      const result = await response.json()
      
      if (result.error) {
        setError(result.error)
      } else {
        setStudents(result.students || [])
        if (result.settings) {
          setSettings(result.settings)
        }
        
        // Initialize exam scores
        const prelim: { [key: string]: string } = {}
        const midterm: { [key: string]: string } = {}
        const finals: { [key: string]: string } = {}
        const legacy: { [key: string]: string } = {}
        
        result.students?.forEach((student: StudentGrade) => {
          prelim[student.student_id] = student.prelim_score?.toString() || ''
          midterm[student.student_id] = student.midterm_score?.toString() || ''
          finals[student.student_id] = student.finals_score?.toString() || ''
          legacy[student.student_id] = student.raw_exam_score?.toString() || ''
        })
        
        setPrelimScores(prelim)
        setMidtermScores(midterm)
        setFinalsScores(finals)
        setExamScores(legacy)
      }
    } catch (err) {
      setError('Failed to fetch grades')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    const total = settings.quiz_percentage + settings.assignment_percentage + settings.exam_percentage
    
    if (total !== 100) {
      setError('Percentages must total 100%')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch(`/api/teacher/grades/${selectedClassId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const result = await response.json()
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Computation settings updated successfully!')
        setSettingsOpen(false)
        fetchGrades() // Refresh to show new calculations
      }
    } catch (err) {
      setError('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExamScore = async (studentId: string) => {
    const prelim = prelimScores[studentId]
    const midterm = midtermScores[studentId]
    const finals = finalsScores[studentId]
    
    // At least one score must be provided
    if (!prelim && !midterm && !finals) {
      setError('Please enter at least one exam score (Prelim, Midterm, or Finals)')
      return
    }
    
    // Validate scores are numbers if provided
    if ((prelim && isNaN(parseFloat(prelim))) ||
        (midterm && isNaN(parseFloat(midterm))) ||
        (finals && isNaN(parseFloat(finals)))) {
      setError('Please enter valid exam scores')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const payload: any = { student_id: studentId }
      
      if (prelim) {
        payload.prelim_score = parseFloat(prelim)
        payload.max_prelim_score = 100
      }
      if (midterm) {
        payload.midterm_score = parseFloat(midterm)
        payload.max_midterm_score = 100
      }
      if (finals) {
        payload.finals_score = parseFloat(finals)
        payload.max_finals_score = 100
      }
      
      const response = await fetch(`/api/teacher/grades/${selectedClassId}/exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Exam scores saved successfully!')
        setEditingExam({ ...editingExam, [studentId]: false })
        fetchGrades() // Refresh to show new calculations
      }
    } catch (err) {
      setError('Failed to save exam scores')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubmissionScore = async (submissionId: string, materialType: string, newScore: string) => {
    if (!newScore || isNaN(parseFloat(newScore))) {
      setError('Please enter a valid score')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch(`/api/teacher/grades/update-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          score: parseFloat(newScore)
        })
      })
      
      const result = await response.json()
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`${materialType} score updated successfully!`)
        fetchGrades() // Refresh to show new calculations
      }
    } catch (err) {
      setError('Failed to update score')
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'success'
    if (grade >= 80) return 'info'
    if (grade >= 75) return 'warning'
    return 'error'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Grades</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage exam scores and view computed grades
          </p>
        </div>
        
        {selectedClassId && (
          <Button
            variant="outlined"
            startIcon={<Settings className="w-4 h-4" />}
            onClick={() => setSettingsOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Computation Settings
          </Button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Class Selection */}
      <Paper className="p-6">
        <FormControl fullWidth>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClassId}
            label="Select Class"
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.class_name} - {cls.subject} ({cls.class_code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Grades Table */}
      {selectedClassId && (
        <Paper>
          {loading ? (
            <Box className="flex items-center justify-center p-12">
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Box className="p-12 text-center">
              <p className="text-gray-500">No students enrolled in this class</p>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Student ID</strong></TableCell>
                    <TableCell><strong>Student Name</strong></TableCell>
                    <TableCell align="center"><strong>Quiz Avg ({settings.quiz_percentage}%)</strong></TableCell>
                    <TableCell align="center"><strong>Assignment Avg ({settings.assignment_percentage}%)</strong></TableCell>
                    <TableCell align="center"><strong>Prelim</strong></TableCell>
                    <TableCell align="center"><strong>Midterm</strong></TableCell>
                    <TableCell align="center"><strong>Finals</strong></TableCell>
                    <TableCell align="center"><strong>Exam Avg ({settings.exam_percentage}%)</strong></TableCell>
                    <TableCell align="center"><strong>Overall Grade</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell>{student.student_number}</TableCell>
                      <TableCell>{student.student_name}</TableCell>
                      <TableCell align="center">
                        {student.quiz_average.toFixed(2)}%
                      </TableCell>
                      <TableCell align="center">
                        {student.assignment_average.toFixed(2)}%
                      </TableCell>
                      {/* Prelim Score */}
                      <TableCell align="center">
                        {editingExam[student.student_id] ? (
                          <TextField
                            size="small"
                            type="number"
                            placeholder="Prelim"
                            value={prelimScores[student.student_id] || ''}
                            onChange={(e) => setPrelimScores({
                              ...prelimScores,
                              [student.student_id]: e.target.value
                            })}
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            sx={{ width: '80px' }}
                          />
                        ) : (
                          <span>{student.prelim_score?.toFixed(2) || '-'}</span>
                        )}
                      </TableCell>
                      {/* Midterm Score */}
                      <TableCell align="center">
                        {editingExam[student.student_id] ? (
                          <TextField
                            size="small"
                            type="number"
                            placeholder="Midterm"
                            value={midtermScores[student.student_id] || ''}
                            onChange={(e) => setMidtermScores({
                              ...midtermScores,
                              [student.student_id]: e.target.value
                            })}
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            sx={{ width: '80px' }}
                          />
                        ) : (
                          <span>{student.midterm_score?.toFixed(2) || '-'}</span>
                        )}
                      </TableCell>
                      {/* Finals Score */}
                      <TableCell align="center">
                        {editingExam[student.student_id] ? (
                          <TextField
                            size="small"
                            type="number"
                            placeholder="Finals"
                            value={finalsScores[student.student_id] || ''}
                            onChange={(e) => setFinalsScores({
                              ...finalsScores,
                              [student.student_id]: e.target.value
                            })}
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            sx={{ width: '80px' }}
                          />
                        ) : (
                          <span>{student.finals_score?.toFixed(2) || '-'}</span>
                        )}
                      </TableCell>
                      {/* Exam Average with Edit/Save Button */}
                      {/* Exam Average with Edit/Save Button */}
                      <TableCell align="center">
                        {editingExam[student.student_id] ? (
                          <Box className="flex items-center gap-2 justify-center">
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Save className="w-4 h-4" />}
                              onClick={() => handleSaveExamScore(student.student_id)}
                              sx={{ 
                                bgcolor: '#16a34a',
                                '&:hover': { bgcolor: '#15803d' }
                              }}
                            >
                              Save
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => setEditingExam({ ...editingExam, [student.student_id]: false })}
                            >
                              <X className="w-4 h-4" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box className="flex items-center gap-2 justify-center">
                            <span>{student.exam_percentage?.toFixed(2) || '0.00'}%</span>
                            <IconButton
                              size="small"
                              onClick={() => setEditingExam({ ...editingExam, [student.student_id]: true })}
                            >
                              <Edit2 className="w-4 h-4" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${student.overall_grade.toFixed(2)}%`}
                          color={getGradeColor(student.overall_grade) as any}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Grade Computation Settings</DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-4">
            <TextField
              fullWidth
              label="Quiz Percentage"
              type="number"
              value={settings.quiz_percentage}
              onChange={(e) => setSettings({ ...settings, quiz_percentage: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, max: 100, step: 1 }}
              helperText="Percentage weight for quizzes"
            />
            <TextField
              fullWidth
              label="Assignment Percentage"
              type="number"
              value={settings.assignment_percentage}
              onChange={(e) => setSettings({ ...settings, assignment_percentage: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, max: 100, step: 1 }}
              helperText="Percentage weight for assignments"
            />
            <TextField
              fullWidth
              label="Exam Percentage"
              type="number"
              value={settings.exam_percentage}
              onChange={(e) => setSettings({ ...settings, exam_percentage: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, max: 100, step: 1 }}
              helperText="Percentage weight for exams"
            />
            <Alert severity="info">
              Total: {settings.quiz_percentage + settings.assignment_percentage + settings.exam_percentage}% (must equal 100%)
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained" disabled={loading}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
