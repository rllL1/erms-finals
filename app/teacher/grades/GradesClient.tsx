'use client'

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
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
  Chip,
  Tabs,
  Tab,
  Tooltip,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  Collapse,
  LinearProgress
} from '@mui/material'
import { Settings, Save, RefreshCw, ChevronDown, ChevronUp, Calculator, Users, BookOpen, ClipboardList, FileText, GraduationCap } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradesClientProps {
  teacherId: string
  classes: {
    id: string
    class_name: string
    subject: string
    class_code: string
  }[]
}

interface TermScores {
  affective_score: number | null
  summative_score: number | null
  formative_score: number | null
}

interface StudentData {
  enrollment_id: string
  student_id: string
  student_number: string
  student_name: string
  scores: {
    prelim: TermScores
    midterm: TermScores
    finals: TermScores
  }
  exam_scores: {
    prelim_score: number | null
    midterm_score: number | null
    finals_score: number | null
  }
}

interface ComputationSettings {
  affective_percentage: number
  summative_percentage: number
  formative_percentage: number
}

type Term = 'prelim' | 'midterm' | 'finals'

interface LocalScores {
  [studentId: string]: {
    prelim: { affective: string; summative: string; formative: string }
    midterm: { affective: string; summative: string; formative: string }
    finals: { affective: string; summative: string; formative: string }
  }
}

interface LocalExamScores {
  [studentId: string]: {
    prelim: string
    midterm: string
    finals: string
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeTermGrade(
  affective: number | null,
  summative: number | null,
  formative: number | null,
  settings: ComputationSettings
): number | null {
  if (affective === null && summative === null && formative === null) return null
  const a = affective ?? 0
  const s = summative ?? 0
  const f = formative ?? 0
  return (
    (a * settings.affective_percentage +
      s * settings.summative_percentage +
      f * settings.formative_percentage) /
    100
  )
}

function computeOverallGrade(
  prelimGrade: number | null,
  midtermGrade: number | null,
  finalsGrade: number | null
): number | null {
  // Formula: ((Prelim + Midterm) / 2 + Finals) / 2
  if (prelimGrade === null && midtermGrade === null && finalsGrade === null) return null

  const p = prelimGrade ?? 0
  const m = midtermGrade ?? 0
  const f = finalsGrade ?? 0

  if (prelimGrade !== null && midtermGrade !== null && finalsGrade !== null) {
    return ((p + m) / 2 + f) / 2
  }
  // Partial: average available terms
  const terms = [prelimGrade, midtermGrade, finalsGrade].filter((t) => t !== null) as number[]
  if (terms.length === 0) return null
  return terms.reduce((acc, t) => acc + t, 0) / terms.length
}

function getGradeColor(grade: number): 'success' | 'info' | 'warning' | 'error' {
  if (grade >= 90) return 'success'
  if (grade >= 80) return 'info'
  if (grade >= 75) return 'warning'
  return 'error'
}

function getGradeColorHex(grade: number): string {
  if (grade >= 90) return '#16a34a'
  if (grade >= 80) return '#2563eb'
  if (grade >= 75) return '#ca8a04'
  return '#dc2626'
}

function parseScore(val: string): number | null {
  if (!val || val.trim() === '') return null
  const num = parseFloat(val)
  return isNaN(num) ? null : Math.min(100, Math.max(0, num))
}

// ─── Component ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function GradesClient({ teacherId, classes }: GradesClientProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Active tab: 0=Prelim, 1=Midterm, 2=Finals, 3=Summary
  const [activeTab, setActiveTab] = useState(0)

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editableSettings, setEditableSettings] = useState(false)
  const [settings, setSettings] = useState<ComputationSettings>({
    affective_percentage: 10,
    summative_percentage: 50,
    formative_percentage: 40
  })
  const [tempSettings, setTempSettings] = useState<ComputationSettings>({
    affective_percentage: 10,
    summative_percentage: 50,
    formative_percentage: 40
  })

  // Local scores for real-time edit
  const [localScores, setLocalScores] = useState<LocalScores>({})

  // Local exam scores for real-time edit
  const [localExamScores, setLocalExamScores] = useState<LocalExamScores>({})
  const [dirtyExamStudents, setDirtyExamStudents] = useState<Set<string>>(new Set())

  // Expanded student in summary
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  // Dirty tracking
  const [dirtyStudents, setDirtyStudents] = useState<Set<string>>(new Set())

  const termLabels: Record<Term, string> = {
    prelim: 'Prelim',
    midterm: 'Midterm',
    finals: 'Finals'
  }

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchGrades = useCallback(async () => {
    if (!selectedClassId) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/teacher/grades/${selectedClassId}/manual-scores`)
      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setStudents(result.students || [])
        if (result.settings) {
          setSettings(result.settings)
          setTempSettings(result.settings)
        }

        // Initialize local scores from fetched data
        const scores: LocalScores = {}
        const examScoresLocal: LocalExamScores = {}
        ;(result.students || []).forEach((s: StudentData) => {
          scores[s.student_id] = {
            prelim: {
              affective: s.scores.prelim.affective_score?.toString() ?? '',
              summative: s.scores.prelim.summative_score?.toString() ?? '',
              formative: s.scores.prelim.formative_score?.toString() ?? ''
            },
            midterm: {
              affective: s.scores.midterm.affective_score?.toString() ?? '',
              summative: s.scores.midterm.summative_score?.toString() ?? '',
              formative: s.scores.midterm.formative_score?.toString() ?? ''
            },
            finals: {
              affective: s.scores.finals.affective_score?.toString() ?? '',
              summative: s.scores.finals.summative_score?.toString() ?? '',
              formative: s.scores.finals.formative_score?.toString() ?? ''
            }
          }
          examScoresLocal[s.student_id] = {
            prelim: s.exam_scores?.prelim_score?.toString() ?? '',
            midterm: s.exam_scores?.midterm_score?.toString() ?? '',
            finals: s.exam_scores?.finals_score?.toString() ?? ''
          }
        })
        setLocalScores(scores)
        setLocalExamScores(examScoresLocal)
        setDirtyStudents(new Set())
        setDirtyExamStudents(new Set())
      }
    } catch {
      setError('Failed to fetch grades')
    } finally {
      setLoading(false)
    }
  }, [selectedClassId])

  useEffect(() => {
    if (selectedClassId) {
      fetchGrades()
    }
  }, [selectedClassId, fetchGrades])

  // ─── Score Update Handler ─────────────────────────────────────────────────

  const handleScoreChange = (
    studentId: string,
    term: Term,
    category: 'affective' | 'summative' | 'formative',
    value: string
  ) => {
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return

    setLocalScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [term]: {
          ...prev[studentId]?.[term],
          [category]: value
        }
      }
    }))

    setDirtyStudents((prev) => new Set(prev).add(studentId))
  }

  // ─── Real-time Computed Grades ────────────────────────────────────────────

  const computedGrades = useMemo(() => {
    const grades: Record<
      string,
      {
        prelim: number | null
        midterm: number | null
        finals: number | null
        overall: number | null
      }
    > = {}

    students.forEach((student) => {
      const local = localScores[student.student_id]
      if (!local) {
        grades[student.student_id] = { prelim: null, midterm: null, finals: null, overall: null }
        return
      }

      const prelimGrade = computeTermGrade(
        parseScore(local.prelim.affective),
        parseScore(local.prelim.summative),
        parseScore(local.prelim.formative),
        settings
      )
      const midtermGrade = computeTermGrade(
        parseScore(local.midterm.affective),
        parseScore(local.midterm.summative),
        parseScore(local.midterm.formative),
        settings
      )
      const finalsGrade = computeTermGrade(
        parseScore(local.finals.affective),
        parseScore(local.finals.summative),
        parseScore(local.finals.formative),
        settings
      )

      grades[student.student_id] = {
        prelim: prelimGrade,
        midterm: midtermGrade,
        finals: finalsGrade,
        overall: computeOverallGrade(prelimGrade, midtermGrade, finalsGrade)
      }
    })

    return grades
  }, [students, localScores, settings])

  // ─── Save Scores ─────────────────────────────────────────────────────────

  const handleSaveTermScores = async (term: Term) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const allScores = students.map((s) => {
        const local = localScores[s.student_id]?.[term]
        return {
          student_id: s.student_id,
          affective_score: local?.affective || null,
          summative_score: local?.summative || null,
          formative_score: local?.formative || null
        }
      })

      const response = await fetch(`/api/teacher/grades/${selectedClassId}/manual-scores/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, scores: allScores })
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`${termLabels[term]} scores saved successfully! (${result.saved} students)`)
        setDirtyStudents(new Set())
        fetchGrades()
      }
    } catch {
      setError('Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAllTerms = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      for (const term of ['prelim', 'midterm', 'finals'] as Term[]) {
        const allScores = students.map((s) => {
          const local = localScores[s.student_id]?.[term]
          return {
            student_id: s.student_id,
            affective_score: local?.affective || null,
            summative_score: local?.summative || null,
            formative_score: local?.formative || null
          }
        })

        await fetch(`/api/teacher/grades/${selectedClassId}/manual-scores/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term, scores: allScores })
        })
      }

      setSuccess('All term scores saved successfully!')
      setDirtyStudents(new Set())
      fetchGrades()
    } catch {
      setError('Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  // ─── Save Settings ────────────────────────────────────────────────────────

  // ─── Exam Score Handlers ──────────────────────────────────────────────────

  const handleExamScoreChange = (
    studentId: string,
    term: 'prelim' | 'midterm' | 'finals',
    value: string
  ) => {
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return

    setLocalExamScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [term]: value
      }
    }))

    setDirtyExamStudents((prev) => new Set(prev).add(studentId))
  }

  const handleSaveExamScores = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const allScores = students.map((s) => {
        const local = localExamScores[s.student_id]
        return {
          student_id: s.student_id,
          prelim_score: local?.prelim || null,
          midterm_score: local?.midterm || null,
          finals_score: local?.finals || null
        }
      })

      const response = await fetch(`/api/teacher/grades/${selectedClassId}/exam/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: allScores })
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`Exam scores saved successfully! (${result.saved} students)`)
        setDirtyExamStudents(new Set())
        fetchGrades()
      }
    } catch {
      setError('Failed to save exam scores')
    } finally {
      setSaving(false)
    }
  }

  // ─── Save Settings (original) ─────────────────────────────────────────────

  const settingsTotal =
    tempSettings.affective_percentage + tempSettings.summative_percentage + tempSettings.formative_percentage

  const handleSaveSettings = async () => {
    if (settingsTotal !== 100) {
      setError('Percentages must total exactly 100%')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Save both old and new columns for backward compatibility
      const response = await fetch(`/api/teacher/grades/${selectedClassId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_percentage: tempSettings.affective_percentage,
          assignment_percentage: tempSettings.summative_percentage,
          exam_percentage: tempSettings.formative_percentage
        })
      })

      const result = await response.json()
      if (result.error) {
        setError(result.error)
      } else {
        setSettings(tempSettings)
        setSuccess('Grade computation settings updated!')
        setSettingsOpen(false)
      }
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render Term Tab Content ──────────────────────────────────────────────

  const renderTermTable = (term: Term) => {
    if (loading) {
      return (
        <Box className="flex items-center justify-center p-12">
          <CircularProgress />
        </Box>
      )
    }

    if (students.length === 0) {
      return (
        <Box className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">No students enrolled in this class</p>
        </Box>
      )
    }

    return (
      <>
        {saving && <LinearProgress />}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Student Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 120 }}>
                  <Tooltip title="Student behavior, attitude, participation" arrow>
                    <Box component="span" sx={{ cursor: 'help', borderBottom: '1px dashed' }}>
                      Affective ({settings.affective_percentage}%)
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 120 }}>
                  <Tooltip title="Quizzes, assignments, performance tasks, recitations" arrow>
                    <Box component="span" sx={{ cursor: 'help', borderBottom: '1px dashed' }}>
                      Summative ({settings.summative_percentage}%)
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 120 }}>
                  <Tooltip title="Major exams" arrow>
                    <Box component="span" sx={{ cursor: 'help', borderBottom: '1px dashed' }}>
                      Formative ({settings.formative_percentage}%)
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 130 }}>
                  Weighted Average
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => {
                const local = localScores[student.student_id]?.[term]
                const termGrade = computedGrades[student.student_id]?.[term]
                const isDirty = dirtyStudents.has(student.student_id)

                return (
                  <TableRow
                    key={student.student_id}
                    sx={{
                      bgcolor: isDirty ? 'rgba(37, 99, 235, 0.04)' : 'inherit',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {student.student_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {student.student_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="text"
                        placeholder="0-100"
                        value={local?.affective ?? ''}
                        onChange={(e) =>
                          handleScoreChange(student.student_id, term, 'affective', e.target.value)
                        }
                        inputProps={{ style: { textAlign: 'center' } }}
                        sx={{ width: '90px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="text"
                        placeholder="0-100"
                        value={local?.summative ?? ''}
                        onChange={(e) =>
                          handleScoreChange(student.student_id, term, 'summative', e.target.value)
                        }
                        inputProps={{ style: { textAlign: 'center' } }}
                        sx={{ width: '90px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="text"
                        placeholder="0-100"
                        value={local?.formative ?? ''}
                        onChange={(e) =>
                          handleScoreChange(student.student_id, term, 'formative', e.target.value)
                        }
                        inputProps={{ style: { textAlign: 'center' } }}
                        sx={{ width: '90px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {termGrade !== null ? (
                        <Chip
                          label={`${termGrade.toFixed(2)}%`}
                          color={getGradeColor(termGrade)}
                          size="small"
                          sx={{ fontWeight: 'bold', minWidth: 80 }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Save button for this term */}
        <Box
          className="flex items-center justify-between p-4"
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" color="text.secondary">
            {dirtyStudents.size > 0
              ? `${dirtyStudents.size} student(s) with unsaved changes`
              : 'All changes saved'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Save className="w-4 h-4" />}
            onClick={() => handleSaveTermScores(term)}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Save {termLabels[term]} Scores
          </Button>
        </Box>
      </>
    )
  }

  // ─── Render Exam Records Tab ────────────────────────────────────────────

  const renderExamTable = () => {
    if (loading) {
      return (
        <Box className="flex items-center justify-center p-12">
          <CircularProgress />
        </Box>
      )
    }

    if (students.length === 0) {
      return (
        <Box className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">No students enrolled in this class</p>
        </Box>
      )
    }

    return (
      <>
        {saving && <LinearProgress />}
        <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            <GraduationCap className="w-4 h-4 inline mr-1" style={{ verticalAlign: 'text-bottom' }} />
            Record exam scores (0–100) for each student per term. Changes are saved when you click &quot;Save Exam Scores&quot;.
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Student Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 120 }}>
                  Prelim Exam
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 120 }}>
                  Midterm Exam
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 120 }}>
                  Finals Exam
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => {
                const local = localExamScores[student.student_id]
                const isDirty = dirtyExamStudents.has(student.student_id)

                return (
                  <TableRow
                    key={student.student_id}
                    sx={{
                      bgcolor: isDirty ? 'rgba(37, 99, 235, 0.04)' : 'inherit',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {student.student_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {student.student_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="text"
                        placeholder="0-100"
                        value={local?.prelim ?? ''}
                        onChange={(e) =>
                          handleExamScoreChange(student.student_id, 'prelim', e.target.value)
                        }
                        inputProps={{ style: { textAlign: 'center' } }}
                        sx={{ width: '90px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="text"
                        placeholder="0-100"
                        value={local?.midterm ?? ''}
                        onChange={(e) =>
                          handleExamScoreChange(student.student_id, 'midterm', e.target.value)
                        }
                        inputProps={{ style: { textAlign: 'center' } }}
                        sx={{ width: '90px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="text"
                        placeholder="0-100"
                        value={local?.finals ?? ''}
                        onChange={(e) =>
                          handleExamScoreChange(student.student_id, 'finals', e.target.value)
                        }
                        inputProps={{ style: { textAlign: 'center' } }}
                        sx={{ width: '90px' }}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Save button for exam scores */}
        <Box
          className="flex items-center justify-between p-4"
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" color="text.secondary">
            {dirtyExamStudents.size > 0
              ? `${dirtyExamStudents.size} student(s) with unsaved changes`
              : 'All changes saved'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Save className="w-4 h-4" />}
            onClick={handleSaveExamScores}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Save Exam Scores
          </Button>
        </Box>
      </>
    )
  }

  // ─── Render Summary Tab ───────────────────────────────────────────────────

  const renderSummary = () => {
    if (loading) {
      return (
        <Box className="flex items-center justify-center p-12">
          <CircularProgress />
        </Box>
      )
    }

    if (students.length === 0) {
      return (
        <Box className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">No students enrolled in this class</p>
        </Box>
      )
    }

    return (
      <>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, width: 40 }} />
                <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Prelim Grade
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Midterm Grade
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Finals Grade
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Overall Final Grade
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => {
                const grades = computedGrades[student.student_id]
                const isExpanded = expandedStudent === student.student_id
                const local = localScores[student.student_id]

                return (
                  <Fragment key={student.student_id}>
                    <TableRow
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => setExpandedStudent(isExpanded ? null : student.student_id)}
                    >
                      <TableCell>
                        <IconButton size="small">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                          {student.student_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {student.student_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {grades?.prelim != null ? (
                          <Chip
                            label={`${grades.prelim.toFixed(2)}%`}
                            color={getGradeColor(grades.prelim)}
                            size="small"
                            sx={{ fontWeight: 'bold', minWidth: 80 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {grades?.midterm != null ? (
                          <Chip
                            label={`${grades.midterm.toFixed(2)}%`}
                            color={getGradeColor(grades.midterm)}
                            size="small"
                            sx={{ fontWeight: 'bold', minWidth: 80 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {grades?.finals != null ? (
                          <Chip
                            label={`${grades.finals.toFixed(2)}%`}
                            color={getGradeColor(grades.finals)}
                            size="small"
                            sx={{ fontWeight: 'bold', minWidth: 80 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {grades?.overall != null ? (
                          <Chip
                            label={`${grades.overall.toFixed(2)}%`}
                            color={getGradeColor(grades.overall)}
                            sx={{ fontWeight: 'bold', fontSize: '0.9rem', minWidth: 90 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Detail Row */}
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 0, border: isExpanded ? undefined : 'none' }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2, px: 2 }}>
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              sx={{ fontWeight: 700, color: 'primary.main' }}
                            >
                              <Calculator
                                className="w-4 h-4 inline mr-1"
                                style={{ verticalAlign: 'text-bottom' }}
                              />
                              Detailed Grade Breakdown — {student.student_name}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {(['prelim', 'midterm', 'finals'] as Term[]).map((term) => {
                                const termGrade = grades?.[term]
                                const scores = local?.[term]

                                return (
                                  <Paper key={term} variant="outlined" sx={{ p: 2 }}>
                                    <Typography
                                      variant="subtitle2"
                                      gutterBottom
                                      sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                                    >
                                      {termLabels[term]}
                                    </Typography>
                                    <Box className="space-y-1">
                                      <Box className="flex justify-between">
                                        <Typography variant="body2" color="text.secondary">
                                          Affective ({settings.affective_percentage}%)
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                          {scores?.affective || '—'}
                                        </Typography>
                                      </Box>
                                      <Box className="flex justify-between">
                                        <Typography variant="body2" color="text.secondary">
                                          Summative ({settings.summative_percentage}%)
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                          {scores?.summative || '—'}
                                        </Typography>
                                      </Box>
                                      <Box className="flex justify-between">
                                        <Typography variant="body2" color="text.secondary">
                                          Formative ({settings.formative_percentage}%)
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                          {scores?.formative || '—'}
                                        </Typography>
                                      </Box>
                                      <Divider sx={{ my: 1 }} />
                                      <Box className="flex justify-between">
                                        <Typography variant="body2" fontWeight={700}>
                                          Weighted Average
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          fontWeight={700}
                                          sx={{
                                            color:
                                              termGrade != null
                                                ? getGradeColorHex(termGrade)
                                                : 'text.disabled'
                                          }}
                                        >
                                          {termGrade != null ? `${termGrade.toFixed(2)}%` : '—'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Paper>
                                )
                              })}
                            </Box>

                            {/* Final Grade Computation Formula */}
                            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'action.hover' }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                                <FileText
                                  className="w-4 h-4 inline mr-1"
                                  style={{ verticalAlign: 'text-bottom' }}
                                />
                                Final Grade Computation
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Formula: ((Prelim + Midterm) ÷ 2 + Finals) ÷ 2
                              </Typography>
                              <Box className="flex items-center gap-2 flex-wrap">
                                <Typography variant="body2">
                                  (({grades?.prelim?.toFixed(2) ?? '?'} +{' '}
                                  {grades?.midterm?.toFixed(2) ?? '?'}) ÷ 2 +{' '}
                                  {grades?.finals?.toFixed(2) ?? '?'}) ÷ 2
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  ={' '}
                                  <span
                                    style={{
                                      color:
                                        grades?.overall != null
                                          ? getGradeColorHex(grades.overall)
                                          : undefined,
                                      fontSize: '1.1rem'
                                    }}
                                  >
                                    {grades?.overall != null
                                      ? `${grades.overall.toFixed(2)}%`
                                      : '—'}
                                  </span>
                                </Typography>
                              </Box>
                            </Paper>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Save All button */}
        <Box
          className="flex items-center justify-between p-4"
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" color="text.secondary">
            Grade summary for {students.length} student(s)
          </Typography>
          <Button
            variant="contained"
            startIcon={<Save className="w-4 h-4" />}
            onClick={handleSaveAllTerms}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Save All Grades
          </Button>
        </Box>
      </>
    )
  }

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            Grade Computation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manually input scores and compute weighted student grades per term
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedClassId && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchGrades}
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<Settings className="w-4 h-4" />}
                onClick={() => {
                  setTempSettings({ ...settings })
                  setSettingsOpen(true)
                }}
                sx={{ textTransform: 'none' }}
              >
                Grading Settings
              </Button>
            </>
          )}
        </div>
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

      {/* Grading Breakdown Info */}
      {selectedClassId && (
        <Paper sx={{ p: 2 }}>
          <Box className="flex items-center gap-6 flex-wrap">
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Grading Breakdown:
            </Typography>
            <Chip
              icon={<Users className="w-3.5 h-3.5" />}
              label={`Affective: ${settings.affective_percentage}%`}
              size="small"
              variant="outlined"
              color="primary"
            />
            <Chip
              icon={<BookOpen className="w-3.5 h-3.5" />}
              label={`Summative: ${settings.summative_percentage}%`}
              size="small"
              variant="outlined"
              color="secondary"
            />
            <Chip
              icon={<FileText className="w-3.5 h-3.5" />}
              label={`Formative: ${settings.formative_percentage}%`}
              size="small"
              variant="outlined"
              color="info"
            />
            <Typography variant="body2" color="text.secondary">
              Total:{' '}
              {settings.affective_percentage +
                settings.summative_percentage +
                settings.formative_percentage}
              %
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Class Selection */}
      <Paper className="p-6">
        <FormControl fullWidth>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClassId}
            label="Select Class"
            onChange={(e) => {
              setSelectedClassId(e.target.value)
              setActiveTab(0)
              setExpandedStudent(null)
            }}
          >
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.class_name} - {cls.subject} ({cls.class_code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Term Tabs + Grade Table */}
      {selectedClassId && (
        <Paper>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="fullWidth"
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
            }}
          >
            <Tab label="Prelim" />
            <Tab label="Midterm" />
            <Tab label="Finals" />
            <Tab
              label="Exam Records"
              icon={<GraduationCap className="w-4 h-4" />}
              iconPosition="start"
            />
            <Tab
              label="Grade Summary"
              icon={<Calculator className="w-4 h-4" />}
              iconPosition="start"
            />
          </Tabs>

          {activeTab === 0 && renderTermTable('prelim')}
          {activeTab === 1 && renderTermTable('midterm')}
          {activeTab === 2 && renderTermTable('finals')}
          {activeTab === 3 && renderExamTable()}
          {activeTab === 4 && renderSummary()}
        </Paper>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Settings
            className="w-5 h-5 inline mr-2"
            style={{ verticalAlign: 'text-bottom' }}
          />
          Grade Computation Settings
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-4">
            <FormControlLabel
              control={
                <Switch
                  checked={editableSettings}
                  onChange={(e) => setEditableSettings(e.target.checked)}
                />
              }
              label="Enable editing of grading percentages"
            />

            <Divider />

            <TextField
              fullWidth
              label="Affective Percentage"
              type="number"
              value={tempSettings.affective_percentage}
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  affective_percentage: parseFloat(e.target.value) || 0
                })
              }
              disabled={!editableSettings}
              inputProps={{ min: 0, max: 100, step: 1 }}
              helperText="Student behavior, attitude, participation"
            />
            <TextField
              fullWidth
              label="Summative Percentage"
              type="number"
              value={tempSettings.summative_percentage}
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  summative_percentage: parseFloat(e.target.value) || 0
                })
              }
              disabled={!editableSettings}
              inputProps={{ min: 0, max: 100, step: 1 }}
              helperText="Quizzes, assignments, performance tasks, recitations"
            />
            <TextField
              fullWidth
              label="Formative Percentage"
              type="number"
              value={tempSettings.formative_percentage}
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  formative_percentage: parseFloat(e.target.value) || 0
                })
              }
              disabled={!editableSettings}
              inputProps={{ min: 0, max: 100, step: 1 }}
              helperText="Major exams"
            />

            <Alert
              severity={
                settingsTotal === 100 ? 'success' : settingsTotal > 100 ? 'error' : 'warning'
              }
            >
              Total: {settingsTotal}%{' '}
              {settingsTotal === 100
                ? '✓ Valid'
                : settingsTotal > 100
                  ? '✗ Exceeds 100% — please adjust'
                  : '✗ Must equal 100%'}
            </Alert>

            <Divider />

            <Typography variant="body2" color="text.secondary">
              <strong>Final Grade Formula:</strong> ((Prelim + Midterm) ÷ 2 + Finals) ÷ 2
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Each term grade is computed as the weighted average of Affective, Summative, and
              Formative scores using the percentages configured above.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            disabled={saving || settingsTotal !== 100}
            sx={{ textTransform: 'none' }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
