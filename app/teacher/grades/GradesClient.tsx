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
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Typography,
  Divider,
  LinearProgress
} from '@mui/material'
import {
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calculator,
  Users,
  ClipboardList,
  FileText
} from 'lucide-react'

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
  details?: Record<string, number | null>
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
    portfolio_score: number | null
  }
}

type Term = 'prelim' | 'midterm' | 'finals'

// Sub-score keys for each category
const AFFECTIVE_KEYS = ['att', 'wrk', 'peer', 'sup'] as const
const FORMATIVE_KEYS = ['hs', 'rec', 'pt', 'sw', 'qs'] as const

// Affective sub-score labels
const AFFECTIVE_LABELS: Record<string, string> = {
  att: 'ATT',
  wrk: 'WRK',
  peer: 'PEER',
  sup: 'SUP'
}

// Formative sub-score labels
const FORMATIVE_LABELS: Record<string, string> = {
  hs: "H'S",
  rec: 'REC',
  pt: 'PT',
  sw: 'SW',
  qs: "Q'S"
}

// Summative exam labels per term
const SUMMATIVE_LABELS: Record<Term, string[]> = {
  prelim: ['PRE'],
  midterm: ['ME'],
  finals: ['AT', 'FE']
}

const SUMMATIVE_KEYS: Record<Term, string[]> = {
  prelim: ['exam1'],
  midterm: ['exam1'],
  finals: ['exam1', 'exam2']
}

// Local state for all sub-scores per student per term
interface TermDetails {
  att: string; wrk: string; peer: string; sup: string
  hs: string; rec: string; pt: string; sw: string; qs: string
  exam1: string; exam2: string
}

interface LocalDetails {
  [studentId: string]: {
    prelim: TermDetails
    midterm: TermDetails
    finals: TermDetails
    portfolio: string
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyTermDetails(): TermDetails {
  return { att: '', wrk: '', peer: '', sup: '', hs: '', rec: '', pt: '', sw: '', qs: '', exam1: '', exam2: '' }
}

function parseScore(val: string): number | null {
  if (!val || val.trim() === '') return null
  const num = parseFloat(val)
  return isNaN(num) ? null : Math.min(100, Math.max(0, num))
}

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function computeAffectiveAvg(d: TermDetails): number | null {
  const vals = AFFECTIVE_KEYS.map(k => parseScore(d[k]))
  return avg(vals)
}

function computeFormativeAvg(d: TermDetails): number | null {
  const vals = FORMATIVE_KEYS.map(k => parseScore(d[k]))
  return avg(vals)
}

function computeSummativeAvg(d: TermDetails, term: Term): number | null {
  const keys = SUMMATIVE_KEYS[term]
  const vals = keys.map(k => parseScore(d[k as keyof TermDetails]))
  return avg(vals)
}

function computeTermGrade(affAvg: number | null, formAvg: number | null, sumAvg: number | null): number | null {
  if (affAvg === null && formAvg === null && sumAvg === null) return null
  const a = (affAvg ?? 0) * 0.10
  const f = (formAvg ?? 0) * 0.50
  const s = (sumAvg ?? 0) * 0.40
  return a + f + s
}

// Points conversion table
function getPoints(grade: number): string {
  if (grade >= 98) return '1.00'
  if (grade >= 95) return '1.25'
  if (grade >= 92) return '1.50'
  if (grade >= 89) return '1.75'
  if (grade >= 86) return '2.00'
  if (grade >= 83) return '2.25'
  if (grade >= 80) return '2.50'
  if (grade >= 77) return '2.75'
  if (grade >= 75) return '3.00'
  if (grade >= 70) return '4.00'
  return '5.00'
}

function getRemarks(grade: number): { text: string; color: string } {
  return grade >= 75
    ? { text: 'PASSED', color: '#16a34a' }
    : { text: 'FAILED', color: '#dc2626' }
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

// ─── Shared styles ────────────────────────────────────────────────────────────

const headerSx = {
  fontWeight: 700,
  fontSize: '0.7rem',
  whiteSpace: 'nowrap' as const,
  py: 0.5,
  px: 0.75,
  textAlign: 'center' as const,
  borderRight: '1px solid',
  borderColor: 'divider'
}

const groupHeaderSx = {
  ...headerSx,
  fontSize: '0.75rem',
  py: 0.75,
  color: '#fff'
}

const cellSx = {
  py: 0.25,
  px: 0.5,
  borderRight: '1px solid',
  borderColor: 'divider',
  textAlign: 'center' as const
}

const inputSx = {
  width: '52px',
  '& .MuiInputBase-input': {
    textAlign: 'center',
    fontSize: '0.8rem',
    py: '4px',
    px: '4px'
  }
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

  // Local details for sub-score editing
  const [localDetails, setLocalDetails] = useState<LocalDetails>({})

  // Dirty tracking
  const [dirtyStudents, setDirtyStudents] = useState<Set<string>>(new Set())

  // Summary expanded student
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

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

        // Initialize local details from fetched data
        const details: LocalDetails = {}
        ;(result.students || []).forEach((s: StudentData) => {
          const pd = (s.scores.prelim.details || {}) as Record<string, number | null>
          const md = (s.scores.midterm.details || {}) as Record<string, number | null>
          const fd = (s.scores.finals.details || {}) as Record<string, number | null>

          const fromDetails = (det: Record<string, number | null>): TermDetails => ({
            att: det.att?.toString() ?? '',
            wrk: det.wrk?.toString() ?? '',
            peer: det.peer?.toString() ?? '',
            sup: det.sup?.toString() ?? '',
            hs: det.hs?.toString() ?? '',
            rec: det.rec?.toString() ?? '',
            pt: det.pt?.toString() ?? '',
            sw: det.sw?.toString() ?? '',
            qs: det.qs?.toString() ?? '',
            exam1: det.exam1?.toString() ?? '',
            exam2: det.exam2?.toString() ?? ''
          })

          details[s.student_id] = {
            prelim: fromDetails(pd),
            midterm: fromDetails(md),
            finals: fromDetails(fd),
            portfolio: s.exam_scores?.portfolio_score?.toString() ?? ''
          }
        })
        setLocalDetails(details)
        setDirtyStudents(new Set())
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

  // ─── Sub-Score Change Handler ─────────────────────────────────────────────

  const handleDetailChange = (
    studentId: string,
    term: Term,
    key: keyof TermDetails,
    value: string
  ) => {
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return

    setLocalDetails(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [term]: {
          ...prev[studentId]?.[term],
          [key]: value
        }
      }
    }))

    setDirtyStudents(prev => new Set(prev).add(studentId))
  }

  const handlePortfolioChange = (studentId: string, value: string) => {
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return

    setLocalDetails(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        portfolio: value
      }
    }))

    setDirtyStudents(prev => new Set(prev).add(studentId))
  }

  // ─── Real-time Computed Grades ────────────────────────────────────────────

  const computedGrades = useMemo(() => {
    const grades: Record<string, {
      prelim: { affAvg: number | null; formAvg: number | null; sumAvg: number | null; aff10: number | null; form50: number | null; sum40: number | null; total: number | null }
      midterm: { affAvg: number | null; formAvg: number | null; sumAvg: number | null; aff10: number | null; form50: number | null; sum40: number | null; total: number | null }
      finals: { affAvg: number | null; formAvg: number | null; sumAvg: number | null; aff10: number | null; form50: number | null; sum40: number | null; total: number | null }
      midtermCombined: number | null
      portfolio: number | null
      finalGrade: number | null
      points: string | null
      remarks: { text: string; color: string } | null
    }> = {}

    students.forEach(student => {
      const local = localDetails[student.student_id]
      if (!local) {
        grades[student.student_id] = {
          prelim: { affAvg: null, formAvg: null, sumAvg: null, aff10: null, form50: null, sum40: null, total: null },
          midterm: { affAvg: null, formAvg: null, sumAvg: null, aff10: null, form50: null, sum40: null, total: null },
          finals: { affAvg: null, formAvg: null, sumAvg: null, aff10: null, form50: null, sum40: null, total: null },
          midtermCombined: null, portfolio: null, finalGrade: null, points: null, remarks: null
        }
        return
      }

      const computeTerm = (term: Term) => {
        const d = local[term] || emptyTermDetails()
        const affAvg = computeAffectiveAvg(d)
        const formAvg = computeFormativeAvg(d)
        const sumAvg = computeSummativeAvg(d, term)
        const aff10 = affAvg !== null ? affAvg * 0.10 : null
        const form50 = formAvg !== null ? formAvg * 0.50 : null
        const sum40 = sumAvg !== null ? sumAvg * 0.40 : null
        const total = computeTermGrade(affAvg, formAvg, sumAvg)
        return { affAvg, formAvg, sumAvg, aff10, form50, sum40, total }
      }

      const prelim = computeTerm('prelim')
      const midterm = computeTerm('midterm')
      const finals = computeTerm('finals')

      // Summary computation
      let midtermCombined: number | null = null
      if (prelim.total !== null && midterm.total !== null) {
        midtermCombined = (prelim.total + midterm.total) / 2
      } else if (prelim.total !== null) {
        midtermCombined = prelim.total
      } else if (midterm.total !== null) {
        midtermCombined = midterm.total
      }

      const portfolio = parseScore(local.portfolio ?? '')

      let finalGrade: number | null = null
      if (midtermCombined !== null && finals.total !== null && portfolio !== null) {
        finalGrade = (midtermCombined * 0.30) + (finals.total * 0.40) + (portfolio * 0.30)
      } else if (midtermCombined !== null && finals.total !== null) {
        finalGrade = (midtermCombined * 0.30) + (finals.total * 0.40)
      }

      const points = finalGrade !== null ? getPoints(finalGrade) : null
      const remarks = finalGrade !== null ? getRemarks(finalGrade) : null

      grades[student.student_id] = { prelim, midterm, finals, midtermCombined, portfolio, finalGrade, points, remarks }
    })

    return grades
  }, [students, localDetails])

  // ─── Save Scores ─────────────────────────────────────────────────────────

  const handleSaveTermScores = async (term: Term) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const allScores = students.map(s => {
        const d = localDetails[s.student_id]?.[term] || emptyTermDetails()
        const affAvg = computeAffectiveAvg(d)
        const formAvg = computeFormativeAvg(d)
        const sumAvg = computeSummativeAvg(d, term)

        // Build details object for persistence
        const details: Record<string, number | null> = {}
        for (const k of AFFECTIVE_KEYS) { details[k] = parseScore(d[k]) }
        for (const k of FORMATIVE_KEYS) { details[k] = parseScore(d[k]) }
        for (const k of SUMMATIVE_KEYS[term]) { details[k] = parseScore(d[k as keyof TermDetails]) }

        return {
          student_id: s.student_id,
          affective_score: affAvg,
          formative_score: formAvg,
          summative_score: sumAvg,
          details
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
        setSuccess(`${term.charAt(0).toUpperCase() + term.slice(1)} scores saved! (${result.saved} students)`)
        setDirtyStudents(new Set())
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
        const allScores = students.map(s => {
          const d = localDetails[s.student_id]?.[term] || emptyTermDetails()
          const affAvg = computeAffectiveAvg(d)
          const formAvg = computeFormativeAvg(d)
          const sumAvg = computeSummativeAvg(d, term)

          const details: Record<string, number | null> = {}
          for (const k of AFFECTIVE_KEYS) { details[k] = parseScore(d[k]) }
          for (const k of FORMATIVE_KEYS) { details[k] = parseScore(d[k]) }
          for (const k of SUMMATIVE_KEYS[term]) { details[k] = parseScore(d[k as keyof TermDetails]) }

          return {
            student_id: s.student_id,
            affective_score: affAvg,
            formative_score: formAvg,
            summative_score: sumAvg,
            details
          }
        })

        await fetch(`/api/teacher/grades/${selectedClassId}/manual-scores/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term, scores: allScores })
        })
      }

      // Also save portfolio scores
      const portfolioScores = students.map(s => ({
        student_id: s.student_id,
        prelim_score: null,
        midterm_score: null,
        finals_score: null,
        portfolio_score: localDetails[s.student_id]?.portfolio || null
      }))

      await fetch(`/api/teacher/grades/${selectedClassId}/exam/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: portfolioScores })
      })

      setSuccess('All grades saved successfully!')
      setDirtyStudents(new Set())
      fetchGrades()
    } catch {
      setError('Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePortfolio = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const scores = students.map(s => ({
        student_id: s.student_id,
        portfolio_score: localDetails[s.student_id]?.portfolio || null
      }))

      const response = await fetch(`/api/teacher/grades/${selectedClassId}/exam/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores })
      })

      const result = await response.json()
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`Portfolio scores saved! (${result.saved} students)`)
      }
    } catch {
      setError('Failed to save portfolio scores')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render Term Tab Content (Digital Class Record) ───────────────────────

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

    const sumKeys = SUMMATIVE_KEYS[term]
    const sumLabels = SUMMATIVE_LABELS[term]

    const affCols = AFFECTIVE_KEYS.length + 2 // inputs + AVE + 10%
    const formCols = FORMATIVE_KEYS.length + 2 // inputs + AVE + 50%
    const sumCols = sumKeys.length + 1 // exam inputs + 40%

    return (
      <>
        {saving && <LinearProgress />}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
            <TableHead>
              {/* Row 1: Group headers */}
              <TableRow>
                <TableCell rowSpan={2} sx={{ ...headerSx, minWidth: 36, bgcolor: '#f5f5f5', position: 'sticky', left: 0, zIndex: 3 }}>#</TableCell>
                <TableCell rowSpan={2} sx={{ ...headerSx, minWidth: 90, bgcolor: '#f5f5f5', position: 'sticky', left: 36, zIndex: 3 }}>Student ID</TableCell>
                <TableCell rowSpan={2} sx={{ ...headerSx, minWidth: 150, bgcolor: '#f5f5f5', position: 'sticky', left: 126, zIndex: 3, textAlign: 'left' }}>Student Name</TableCell>
                <TableCell colSpan={affCols} align="center" sx={{ ...groupHeaderSx, bgcolor: '#4caf50' }}>
                  AFFECTIVE — 10%
                </TableCell>
                <TableCell colSpan={formCols} align="center" sx={{ ...groupHeaderSx, bgcolor: '#ff9800' }}>
                  FORMATIVE — 50%
                </TableCell>
                <TableCell colSpan={sumCols} align="center" sx={{ ...groupHeaderSx, bgcolor: '#f44336' }}>
                  SUMMATIVE — 40%
                </TableCell>
                <TableCell rowSpan={2} sx={{ ...headerSx, minWidth: 68, bgcolor: '#7b1fa2', color: '#fff', fontSize: '0.75rem' }}>
                  TOTAL
                </TableCell>
              </TableRow>
              {/* Row 2: Sub-column headers */}
              <TableRow>
                {/* Affective sub-columns */}
                {AFFECTIVE_KEYS.map(k => (
                  <TableCell key={k} sx={{ ...headerSx, bgcolor: '#e8f5e9' }}>
                    {AFFECTIVE_LABELS[k]}
                  </TableCell>
                ))}
                <TableCell sx={{ ...headerSx, bgcolor: '#c8e6c9', fontWeight: 800 }}>AVE</TableCell>
                <TableCell sx={{ ...headerSx, bgcolor: '#a5d6a7', fontWeight: 800 }}>10%</TableCell>

                {/* Formative sub-columns */}
                {FORMATIVE_KEYS.map(k => (
                  <TableCell key={k} sx={{ ...headerSx, bgcolor: '#fff3e0' }}>
                    {FORMATIVE_LABELS[k]}
                  </TableCell>
                ))}
                <TableCell sx={{ ...headerSx, bgcolor: '#ffe0b2', fontWeight: 800 }}>AVE</TableCell>
                <TableCell sx={{ ...headerSx, bgcolor: '#ffcc80', fontWeight: 800 }}>50%</TableCell>

                {/* Summative sub-columns */}
                {sumLabels.map((label, i) => (
                  <TableCell key={i} sx={{ ...headerSx, bgcolor: '#ffebee' }}>
                    {label}
                  </TableCell>
                ))}
                <TableCell sx={{ ...headerSx, bgcolor: '#ffcdd2', fontWeight: 800 }}>40%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, idx) => {
                const d = localDetails[student.student_id]?.[term] || emptyTermDetails()
                const g = computedGrades[student.student_id]?.[term]
                const isDirty = dirtyStudents.has(student.student_id)
                const stickyBg = isDirty ? '#f0f4ff' : '#fff'

                return (
                  <TableRow
                    key={student.student_id}
                    sx={{
                      bgcolor: isDirty ? 'rgba(37, 99, 235, 0.04)' : 'inherit',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    {/* # */}
                    <TableCell sx={{ ...cellSx, fontWeight: 600, fontSize: '0.75rem', position: 'sticky', left: 0, bgcolor: stickyBg, zIndex: 1 }}>
                      {idx + 1}
                    </TableCell>
                    {/* Student ID */}
                    <TableCell sx={{ ...cellSx, fontFamily: 'monospace', fontSize: '0.72rem', position: 'sticky', left: 36, bgcolor: stickyBg, zIndex: 1 }}>
                      {student.student_number}
                    </TableCell>
                    {/* Student Name */}
                    <TableCell sx={{ ...cellSx, textAlign: 'left', fontWeight: 500, fontSize: '0.78rem', position: 'sticky', left: 126, bgcolor: stickyBg, zIndex: 1, minWidth: 150 }}>
                      {student.student_name}
                    </TableCell>

                    {/* Affective inputs */}
                    {AFFECTIVE_KEYS.map(k => (
                      <TableCell key={k} sx={{ ...cellSx, bgcolor: '#f9fbe7' }}>
                        <TextField
                          size="small"
                          variant="standard"
                          placeholder="—"
                          value={d[k]}
                          onChange={e => handleDetailChange(student.student_id, term, k, e.target.value)}
                          sx={inputSx}
                          InputProps={{ disableUnderline: true }}
                        />
                      </TableCell>
                    ))}
                    {/* Affective AVE */}
                    <TableCell sx={{ ...cellSx, bgcolor: '#f0f4c3', fontWeight: 700, fontSize: '0.78rem' }}>
                      {g?.affAvg != null ? g.affAvg.toFixed(2) : '—'}
                    </TableCell>
                    {/* Affective 10% */}
                    <TableCell sx={{ ...cellSx, bgcolor: '#e6ee9c', fontWeight: 700, fontSize: '0.78rem' }}>
                      {g?.aff10 != null ? g.aff10.toFixed(2) : '—'}
                    </TableCell>

                    {/* Formative inputs */}
                    {FORMATIVE_KEYS.map(k => (
                      <TableCell key={k} sx={{ ...cellSx, bgcolor: '#fff8e1' }}>
                        <TextField
                          size="small"
                          variant="standard"
                          placeholder="—"
                          value={d[k]}
                          onChange={e => handleDetailChange(student.student_id, term, k, e.target.value)}
                          sx={inputSx}
                          InputProps={{ disableUnderline: true }}
                        />
                      </TableCell>
                    ))}
                    {/* Formative AVE */}
                    <TableCell sx={{ ...cellSx, bgcolor: '#ffecb3', fontWeight: 700, fontSize: '0.78rem' }}>
                      {g?.formAvg != null ? g.formAvg.toFixed(2) : '—'}
                    </TableCell>
                    {/* Formative 50% */}
                    <TableCell sx={{ ...cellSx, bgcolor: '#ffe082', fontWeight: 700, fontSize: '0.78rem' }}>
                      {g?.form50 != null ? g.form50.toFixed(2) : '—'}
                    </TableCell>

                    {/* Summative inputs */}
                    {sumKeys.map(k => (
                      <TableCell key={k} sx={{ ...cellSx, bgcolor: '#fce4ec' }}>
                        <TextField
                          size="small"
                          variant="standard"
                          placeholder="—"
                          value={d[k as keyof TermDetails]}
                          onChange={e => handleDetailChange(student.student_id, term, k as keyof TermDetails, e.target.value)}
                          sx={inputSx}
                          InputProps={{ disableUnderline: true }}
                        />
                      </TableCell>
                    ))}
                    {/* Summative 40% */}
                    <TableCell sx={{ ...cellSx, bgcolor: '#f8bbd0', fontWeight: 700, fontSize: '0.78rem' }}>
                      {g?.sum40 != null ? g.sum40.toFixed(2) : '—'}
                    </TableCell>

                    {/* TOTAL */}
                    <TableCell sx={{ ...cellSx, fontWeight: 800, fontSize: '0.82rem', bgcolor: g?.total != null && g.total >= 75 ? '#e8f5e9' : g?.total != null ? '#ffebee' : 'inherit' }}>
                      {g?.total != null ? (
                        <Chip
                          label={g.total.toFixed(2)}
                          size="small"
                          color={getGradeColor(g.total)}
                          sx={{ fontWeight: 'bold', fontSize: '0.78rem', height: 24 }}
                        />
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Save button */}
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
            Save {term.charAt(0).toUpperCase() + term.slice(1)} Scores
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
        {saving && <LinearProgress />}

        {/* Formula info bar */}
        <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#6a1b9a', mb: 0.5 }}>
            <Calculator className="w-4 h-4 inline mr-1" style={{ verticalAlign: 'text-bottom' }} />
            Final Grade Formula
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            Midterm Combined = (Prelim Grade + Midterm Grade) &divide; 2
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            Final Grade = (Midterm Combined &times; 30%) + (Finals Grade &times; 40%) + (Portfolio &times; 30%)
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, width: 40 }} />
                <TableCell sx={{ fontWeight: 700, minWidth: 36 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 90 }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Student Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#e3f2fd' }}>Prelim</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#e8f5e9' }}>Midterm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#e0f2f1' }}>M. Combined</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#fff3e0' }}>Finals</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#fce4ec', minWidth: 85 }}>Portfolio</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#f3e5f5' }}>Final Grade</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#e8eaf6' }}>Points</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#e0f7fa' }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, idx) => {
                const g = computedGrades[student.student_id]
                const isExpanded = expandedStudent === student.student_id

                return (
                  <Fragment key={student.student_id}>
                    <TableRow
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => setExpandedStudent(isExpanded ? null : student.student_id)}
                    >
                      <TableCell>
                        <IconButton size="small">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{idx + 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                          {student.student_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{student.student_name}</Typography>
                      </TableCell>

                      {/* Prelim */}
                      <TableCell align="center" sx={{ bgcolor: '#f5f9ff' }}>
                        {g?.prelim.total != null ? (
                          <Chip label={g.prelim.total.toFixed(2)} size="small" color={getGradeColor(g.prelim.total)} sx={{ fontWeight: 'bold', minWidth: 60, height: 24 }} />
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>

                      {/* Midterm */}
                      <TableCell align="center" sx={{ bgcolor: '#f5faf5' }}>
                        {g?.midterm.total != null ? (
                          <Chip label={g.midterm.total.toFixed(2)} size="small" color={getGradeColor(g.midterm.total)} sx={{ fontWeight: 'bold', minWidth: 60, height: 24 }} />
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>

                      {/* Midterm Combined */}
                      <TableCell align="center" sx={{ bgcolor: '#f0f9f8' }}>
                        {g?.midtermCombined != null ? (
                          <Typography variant="body2" fontWeight={700} sx={{ color: getGradeColorHex(g.midtermCombined) }}>
                            {g.midtermCombined.toFixed(2)}
                          </Typography>
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>

                      {/* Finals */}
                      <TableCell align="center" sx={{ bgcolor: '#fffaf0' }}>
                        {g?.finals.total != null ? (
                          <Chip label={g.finals.total.toFixed(2)} size="small" color={getGradeColor(g.finals.total)} sx={{ fontWeight: 'bold', minWidth: 60, height: 24 }} />
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>

                      {/* Portfolio input */}
                      <TableCell align="center" sx={{ bgcolor: '#fef5f8' }} onClick={e => e.stopPropagation()}>
                        <TextField
                          size="small"
                          type="text"
                          placeholder="0-100"
                          value={localDetails[student.student_id]?.portfolio ?? ''}
                          onChange={e => handlePortfolioChange(student.student_id, e.target.value)}
                          inputProps={{ style: { textAlign: 'center', fontSize: '0.85rem' } }}
                          sx={{ width: '70px' }}
                        />
                      </TableCell>

                      {/* Final Grade */}
                      <TableCell align="center" sx={{ bgcolor: '#f9f0fc' }}>
                        {g?.finalGrade != null ? (
                          <Chip
                            label={g.finalGrade.toFixed(2)}
                            color={getGradeColor(g.finalGrade)}
                            sx={{ fontWeight: 'bold', fontSize: '0.85rem', minWidth: 70, height: 26 }}
                          />
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>

                      {/* Points */}
                      <TableCell align="center" sx={{ bgcolor: '#f5f5fc' }}>
                        {g?.points ? (
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#1a237e' }}>
                            {g.points}
                          </Typography>
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>

                      {/* Remarks */}
                      <TableCell align="center" sx={{ bgcolor: '#f0fafe' }}>
                        {g?.remarks ? (
                          <Chip
                            label={g.remarks.text}
                            size="small"
                            sx={{ fontWeight: 'bold', bgcolor: g.remarks.color, color: '#fff', minWidth: 65, height: 24 }}
                          />
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                    </TableRow>

                    {/* Expanded detail row */}
                    <TableRow>
                      <TableCell colSpan={12} sx={{ py: 0, border: isExpanded ? undefined : 'none' }}>
                        {isExpanded && (
                          <Box sx={{ py: 2, px: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                              <Calculator className="w-4 h-4 inline mr-1" style={{ verticalAlign: 'text-bottom' }} />
                              Detailed Grade Breakdown — {student.student_name}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {(['prelim', 'midterm', 'finals'] as Term[]).map(term => {
                                const tg = g?.[term]
                                const det = localDetails[student.student_id]?.[term] || emptyTermDetails()
                                return (
                                  <Paper key={term} variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                                      {term}
                                    </Typography>
                                    <Box className="space-y-1">
                                      {/* Affective breakdown */}
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#4caf50' }}>
                                        Affective (10%)
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                        {AFFECTIVE_KEYS.map(k => (
                                          <Typography key={k} variant="caption" color="text.secondary">
                                            {AFFECTIVE_LABELS[k]}: {det[k] || '—'}
                                          </Typography>
                                        ))}
                                      </Box>
                                      <Box className="flex justify-between">
                                        <Typography variant="body2" color="text.secondary">AVE &rarr; 10%</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                          {tg?.affAvg?.toFixed(2) ?? '—'} &rarr; {tg?.aff10?.toFixed(2) ?? '—'}
                                        </Typography>
                                      </Box>

                                      <Divider sx={{ my: 0.5 }} />

                                      {/* Formative breakdown */}
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#ff9800' }}>
                                        Formative (50%)
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                        {FORMATIVE_KEYS.map(k => (
                                          <Typography key={k} variant="caption" color="text.secondary">
                                            {FORMATIVE_LABELS[k]}: {det[k] || '—'}
                                          </Typography>
                                        ))}
                                      </Box>
                                      <Box className="flex justify-between">
                                        <Typography variant="body2" color="text.secondary">AVE &rarr; 50%</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                          {tg?.formAvg?.toFixed(2) ?? '—'} &rarr; {tg?.form50?.toFixed(2) ?? '—'}
                                        </Typography>
                                      </Box>

                                      <Divider sx={{ my: 0.5 }} />

                                      {/* Summative breakdown */}
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#f44336' }}>
                                        Summative (40%)
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                        {SUMMATIVE_KEYS[term].map((k, i) => (
                                          <Typography key={k} variant="caption" color="text.secondary">
                                            {SUMMATIVE_LABELS[term][i]}: {det[k as keyof TermDetails] || '—'}
                                          </Typography>
                                        ))}
                                      </Box>
                                      <Box className="flex justify-between">
                                        <Typography variant="body2" color="text.secondary">AVE &rarr; 40%</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                          {tg?.sumAvg?.toFixed(2) ?? '—'} &rarr; {tg?.sum40?.toFixed(2) ?? '—'}
                                        </Typography>
                                      </Box>

                                      <Divider sx={{ my: 1 }} />
                                      <Box className="flex justify-between">
                                        <Typography variant="body2" fontWeight={700}>Term Grade</Typography>
                                        <Typography variant="body2" fontWeight={700}
                                          sx={{ color: tg?.total != null ? getGradeColorHex(tg.total) : 'text.disabled' }}
                                        >
                                          {tg?.total != null ? tg.total.toFixed(2) : '—'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Paper>
                                )
                              })}
                            </Box>

                            {/* Final Grade computation detail */}
                            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#f3e5f5' }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                                <FileText className="w-4 h-4 inline mr-1" style={{ verticalAlign: 'text-bottom' }} />
                                Final Grade Computation
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Midterm Combined = ({g?.prelim.total?.toFixed(2) ?? '?'} + {g?.midterm.total?.toFixed(2) ?? '?'}) &divide; 2 = <strong>{g?.midtermCombined?.toFixed(2) ?? '?'}</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Final Grade = ({g?.midtermCombined?.toFixed(2) ?? '?'} &times; 30%) + ({g?.finals.total?.toFixed(2) ?? '?'} &times; 40%) + ({g?.portfolio?.toFixed(2) ?? '?'} &times; 30%)
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                ={' '}
                                <span style={{
                                  color: g?.finalGrade != null ? getGradeColorHex(g.finalGrade) : undefined,
                                  fontSize: '1.1rem'
                                }}>
                                  {g?.finalGrade != null ? g.finalGrade.toFixed(2) : '—'}
                                </span>
                                {g?.points && (
                                  <span style={{ marginLeft: 12, color: '#1a237e' }}>
                                    Points: {g.points}
                                  </span>
                                )}
                                {g?.remarks && (
                                  <span style={{ marginLeft: 12, color: g.remarks.color, fontWeight: 800 }}>
                                    {g.remarks.text}
                                  </span>
                                )}
                              </Typography>
                            </Paper>

                            {/* Points conversion reference */}
                            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#e8eaf6' }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                                Points Conversion Table
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {[
                                  { range: '100–98', pt: '1.00' }, { range: '97–95', pt: '1.25' },
                                  { range: '94–92', pt: '1.50' }, { range: '91–89', pt: '1.75' },
                                  { range: '88–86', pt: '2.00' }, { range: '85–83', pt: '2.25' },
                                  { range: '82–80', pt: '2.50' }, { range: '79–77', pt: '2.75' },
                                  { range: '76–75', pt: '3.00' }, { range: '74–70', pt: '4.00' },
                                  { range: 'Below 70', pt: '5.00' }
                                ].map(item => (
                                  <Chip
                                    key={item.pt}
                                    label={`${item.range} → ${item.pt}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                            </Paper>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Save buttons */}
        <Box
          className="flex items-center justify-between p-4"
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" color="text.secondary">
            Grade summary for {students.length} student(s)
          </Typography>
          <Box className="flex gap-2">
            <Button
              variant="outlined"
              startIcon={<Save className="w-4 h-4" />}
              onClick={handleSavePortfolio}
              disabled={saving}
              sx={{ textTransform: 'none' }}
            >
              Save Portfolio
            </Button>
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
            Digital class record — input sub-scores and auto-compute weighted grades per term
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedClassId && (
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

      {/* Grading Overview */}
      {selectedClassId && (
        <Paper sx={{ p: 2 }}>
          <Box className="flex items-center gap-4 flex-wrap">
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Grading Structure:
            </Typography>
            <Chip
              label="Affective: 10%"
              size="small"
              sx={{ bgcolor: '#4caf50', color: '#fff', fontWeight: 600 }}
            />
            <Chip
              label="Formative: 50%"
              size="small"
              sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600 }}
            />
            <Chip
              label="Summative: 40%"
              size="small"
              sx={{ bgcolor: '#f44336', color: '#fff', fontWeight: 600 }}
            />
            <Divider orientation="vertical" flexItem />
            <Typography variant="caption" color="text.secondary">
              Final = (MCombined&times;30%) + (Finals&times;40%) + (Portfolio&times;30%)
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
            onChange={e => {
              setSelectedClassId(e.target.value)
              setActiveTab(0)
              setExpandedStudent(null)
            }}
          >
            {classes.map(cls => (
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
              label="Summary"
              icon={<Calculator className="w-4 h-4" />}
              iconPosition="start"
            />
          </Tabs>

          {activeTab === 0 && renderTermTable('prelim')}
          {activeTab === 1 && renderTermTable('midterm')}
          {activeTab === 2 && renderTermTable('finals')}
          {activeTab === 3 && renderSummary()}
        </Paper>
      )}
    </div>
  )
}
