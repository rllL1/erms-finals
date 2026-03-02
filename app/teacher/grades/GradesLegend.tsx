'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { ChevronDown, ChevronUp, BookOpen, Info } from 'lucide-react'

// ─── Legend Data ──────────────────────────────────────────────────────────────

const MIDTERM_LEGEND = [
  { code: 'ATT', description: 'Attendance', color: '#4caf50' },
  { code: 'WRK', description: 'Attitude Towards Work', color: '#4caf50' },
  { code: 'PEER', description: 'Attitude Towards Peers', color: '#4caf50' },
  { code: 'SUP', description: 'Attitude Towards Superior', color: '#4caf50' },
  { code: 'AVE', description: 'Average', color: '#388e3c' },
  { code: "H'S", description: 'Homework', color: '#ff9800' },
  { code: "Q'S", description: 'Quizzes', color: '#ff9800' },
  { code: 'PT', description: 'Performance Task', color: '#ff9800' },
  { code: 'SW', description: 'Seatwork', color: '#ff9800' },
  { code: 'REC', description: 'Recitation', color: '#ff9800' },
  { code: 'PRE', description: 'Preliminary Examination', color: '#f44336' },
  { code: 'ME', description: 'Midterm Examination', color: '#f44336' },
]

const FINAL_LEGEND = [
  { code: 'ATT', description: 'Attendance', color: '#4caf50' },
  { code: 'WRK', description: 'Attitude Towards Work', color: '#4caf50' },
  { code: 'PEER', description: 'Attitude Towards Peers', color: '#4caf50' },
  { code: 'SUP', description: 'Attitude Towards Superior', color: '#4caf50' },
  { code: 'AVE', description: 'Average', color: '#388e3c' },
  { code: "H'S", description: 'Homework', color: '#ff9800' },
  { code: "Q'S", description: 'Quizzes', color: '#ff9800' },
  { code: 'PT', description: 'Performance Task', color: '#ff9800' },
  { code: 'SW', description: 'Seatwork', color: '#ff9800' },
  { code: 'REC', description: 'Recitation', color: '#ff9800' },
  { code: 'AT', description: 'Achievement Test', color: '#f44336' },
  { code: 'FE', description: 'Final Examination', color: '#f44336' },
]

const GRADE_EQUIVALENTS = [
  { grade: '1.00', range: '100–98', color: '#16a34a', bg: '#f0fdf4' },
  { grade: '1.25', range: '97–95', color: '#16a34a', bg: '#f0fdf4' },
  { grade: '1.50', range: '94–92', color: '#22c55e', bg: '#f0fdf4' },
  { grade: '1.75', range: '91–89', color: '#22c55e', bg: '#f0fdf4' },
  { grade: '2.00', range: '88–86', color: '#2563eb', bg: '#eff6ff' },
  { grade: '2.25', range: '85–83', color: '#2563eb', bg: '#eff6ff' },
  { grade: '2.50', range: '82–80', color: '#3b82f6', bg: '#eff6ff' },
  { grade: '2.75', range: '79–77', color: '#ca8a04', bg: '#fefce8' },
  { grade: '3.00', range: '76–75', color: '#ca8a04', bg: '#fefce8' },
  { grade: '4.00', range: '74–70', color: '#ea580c', bg: '#fff7ed', note: 'Conditional – Midterm Period only' },
  { grade: '5.00', range: 'Below 70', color: '#dc2626', bg: '#fef2f2', note: 'Given in Major Exams only' },
  { grade: 'INC', range: '—', color: '#6b7280', bg: '#f3f4f6', note: 'Incomplete (Failed due to Excessive Absence)' },
]

// ─── Sub-Components ──────────────────────────────────────────────────────────

function LegendTable({
  title,
  items,
  icon,
}: {
  title: string
  items: typeof MIDTERM_LEGEND
  icon: React.ReactNode
}) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {icon}
        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {title}
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 0.75, width: isMobile ? 70 : 100 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 0.75 }}>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.code + item.description} sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ py: 0.5, px: 1.5 }}>
                  <Chip
                    label={item.code}
                    size="small"
                    sx={{
                      bgcolor: item.color,
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 24,
                      minWidth: 50,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, fontSize: { xs: '0.75rem', sm: '0.8rem' }, color: 'text.secondary' }}>
                  {item.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

function GradeEquivalentTable() {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Info size={18} color="#6366f1" />
        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          SUMMARY — GRADE EQUIVALENT
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 0.75, width: isSmall ? 70 : 100 }}>Grade</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 0.75, width: isSmall ? 80 : 120 }}>Equivalent</TableCell>
              {!isSmall && (
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 0.75 }}>Note</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {GRADE_EQUIVALENTS.map((item) => (
              <TableRow key={item.grade} sx={{ bgcolor: item.bg, '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ py: 0.5, px: 1.5 }}>
                  <Chip
                    label={item.grade}
                    size="small"
                    sx={{
                      bgcolor: item.color,
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 24,
                      minWidth: 50,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, fontSize: { xs: '0.75rem', sm: '0.8rem' }, fontWeight: 600 }}>
                  {item.range}
                </TableCell>
                {!isSmall && (
                  <TableCell sx={{ py: 0.5, fontSize: '0.75rem', color: 'text.secondary', fontStyle: item.note ? 'italic' : 'normal' }}>
                    {item.note || ''}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {isSmall && (
        <Box sx={{ mt: 1, px: 1 }}>
          {GRADE_EQUIVALENTS.filter(i => i.note).map((item) => (
            <Typography key={item.grade} variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              <strong>{item.grade}:</strong> {item.note}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  )
}

// ─── Main Legend Component ───────────────────────────────────────────────────

export default function GradesLegend() {
  const [expanded, setExpanded] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        border: '1px solid',
        borderColor: expanded ? '#c7d2fe' : 'divider',
        borderRadius: 2,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Collapsible Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          py: 1.5,
          cursor: 'pointer',
          bgcolor: expanded ? '#eef2ff' : '#f8fafc',
          transition: 'background-color 0.2s',
          '&:hover': { bgcolor: '#eef2ff' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BookOpen size={20} color="#6366f1" />
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#312e81' }}>
            Grade Legend &amp; Reference
          </Typography>
          <Chip
            label={expanded ? 'Hide' : 'Show'}
            size="small"
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem', borderColor: '#c7d2fe', color: '#6366f1' }}
          />
        </Box>
        <IconButton size="small" sx={{ color: '#6366f1' }}>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </IconButton>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: { xs: 3, sm: 4 },
            }}
          >
            {/* Midterm Legend */}
            <LegendTable
              title="MIDTERM PERIOD — LEGEND"
              items={MIDTERM_LEGEND}
              icon={<Chip label="MID" size="small" sx={{ bgcolor: '#2563eb', color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />}
            />

            {/* Final Legend */}
            <LegendTable
              title="FINAL PERIOD — LEGEND"
              items={FINAL_LEGEND}
              icon={<Chip label="FIN" size="small" sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />}
            />

            {/* Grade Equivalents */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1', lg: 'auto' } }}>
              <GradeEquivalentTable />
            </Box>
          </Box>

          {/* Footer note */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f1f5f9', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              <strong>Grading Structure:</strong> Affective (10%) + Formative (50%) + Summative (40%) = Term Grade.{' '}
              Final Grade = (Midterm Combined × 30%) + (Finals Grade × 40%) + (Portfolio × 30%).{' '}
              Midterm Combined = (Prelim Grade + Midterm Grade) ÷ 2.
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}
