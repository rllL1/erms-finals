'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import {
  Search,
  Printer,
  Download,
  Eye,
  FileText,
  Calendar,
  User,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { generateExamPDF } from '@/app/teacher/quiz/utils/pdfGenerator'

interface Question {
  id: string
  question_type: string
  question: string
  options?: string[] | { options: string[] } | null
  correct_answer: string
  order_number: number
}

// Helper function to safely extract options array from Question
function getOptionsArray(options: string[] | { options: string[] } | null | undefined): string[] {
  if (!options) return []
  if (Array.isArray(options)) return options
  return options.options || []
}

interface Submission {
  id: string
  student_name: string
  student_email: string
  submitted_at: string
  score?: number
  status: string
}

interface ExamRecord {
  id: string
  title: string
  type: 'quiz' | 'assignment' | 'exam'
  quiz_type?: string
  teacher_name: string
  teacher_id: string
  start_date?: string
  end_date?: string
  created_at: string
  show_answer_key: boolean
  question_count: number
  submission_count: number
  questions?: Question[]
  submissions?: Submission[]
  period?: string
  school_name?: string
  introduction?: string
}

export default function RecordsClient() {
  const [records, setRecords] = useState<ExamRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<ExamRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ExamRecord | null>(null)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/records')
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records)
      }
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterRecords = useCallback(() => {
    let filtered = [...records]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (record) =>
          record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((record) => record.type === typeFilter)
    }

    setFilteredRecords(filtered)
  }, [records, searchQuery, typeFilter])

  useEffect(() => {
    fetchRecords()
  }, [])

  useEffect(() => {
    filterRecords()
  }, [filterRecords])

  const handlePreview = async (record: ExamRecord) => {
    // Fetch full exam details with questions
    console.log('Preview clicked for record:', record.id, record.title)
    try {
      const response = await fetch(`/api/admin/records/${record.id}`)
      console.log('API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        setSelectedRecord(data.record)
        setPreviewOpen(true)
      } else {
        const errorText = await response.text()
        console.error('API error status:', response.status, 'Body:', errorText)
        // Still try to open preview with basic record data
        setSelectedRecord(record)
        setPreviewOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch exam details:', error)
      setSelectedRecord(record)
      setPreviewOpen(true)
    }
  }

  const handlePrint = async (record: ExamRecord) => {
    // Fetch full exam details with questions first
    if (record.type === 'exam') {
      try {
        const response = await fetch(`/api/admin/records/${record.id}`)
        if (response.ok) {
          const data = await response.json()
          const fullRecord = data.record
          
          // Use PDF generator for exams with questions
          if (fullRecord.questions && fullRecord.questions.length > 0) {
            const examData = {
              id: fullRecord.id,
              title: fullRecord.title,
              period: fullRecord.period || 'General',
              schoolName: fullRecord.school_name || 'School Name',
              introduction: fullRecord.introduction || '',
              questions: fullRecord.questions
                .sort((a: Question, b: Question) => a.order_number - b.order_number)
                .map((q: Question) => ({
                  id: q.id,
                  type: q.question_type,
                  question: q.question,
                  options: q.question_type === 'multiple-choice' && q.options
                    ? getOptionsArray(q.options)
                    : undefined,
                  points: 1, // Default points
                }))
            }
            generateExamPDF(examData, 'print')
            return
          }
        }
      } catch (error) {
        console.error('Failed to fetch exam details for print:', error)
      }
    }

    // Fallback to the original print method for non-exams or if fetch failed
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const questionsHtml = record.questions
      ? `
        <div class="section">
          <div class="section-title">Questions</div>
          ${record.questions
            .sort((a, b) => a.order_number - b.order_number)
            .map((q, index) => {
              let optionsHtml = ''
              if (q.question_type === 'multiple-choice' && q.options) {
                const options = getOptionsArray(q.options)
                optionsHtml = `
                  <div style="margin-top: 10px;">
                    ${options
                      .map(
                        (opt: string, i: number) => `
                      <div style="padding: 5px 0; padding-left: 20px;">
                        ${String.fromCharCode(65 + i)}. ${opt}
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                `
              }
              
              const answerHtml = record.show_answer_key
                ? `<div style="margin-top: 10px; padding: 10px; background-color: #f0fdf4; border-left: 3px solid #16a34a;">
                    <strong>Answer:</strong> ${q.correct_answer}
                  </div>`
                : ''

              return `
                <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <div style="font-weight: bold; color: #16a34a; margin-bottom: 8px;">
                    Question ${index + 1} (${q.question_type})
                  </div>
                  <div style="margin-bottom: 10px;">
                    ${q.question}
                  </div>
                  ${optionsHtml}
                  ${answerHtml}
                </div>
              `
            })
            .join('')}
        </div>
      `
      : ''

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Exam Record - ${record.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .section {
              margin: 20px 0;
              page-break-inside: avoid;
            }
            .section-title {
              font-weight: bold;
              color: #16a34a;
              margin-bottom: 10px;
              font-size: 18px;
              border-bottom: 2px solid #16a34a;
              padding-bottom: 5px;
            }
            .detail-row {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              width: 180px;
              color: #555;
            }
            .detail-value {
              flex: 1;
              color: #333;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .badge-exam {
              background-color: #dcfce7;
              color: #16a34a;
            }
            .badge-quiz {
              background-color: #dbeafe;
              color: #2563eb;
            }
            .badge-assignment {
              background-color: #fef3c7;
              color: #d97706;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #333;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Exam Records Management System</h1>
            <p>Exam Record Details</p>
            <p>Generated on ${format(new Date(), 'PPpp')}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Exam Information</div>
            <div class="detail-row">
              <span class="detail-label">Title:</span>
              <span class="detail-value">${record.title}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">
                <span class="badge badge-${record.type}">${record.type.toUpperCase()}</span>
              </span>
            </div>
            ${
              record.quiz_type
                ? `<div class="detail-row">
                <span class="detail-label">Quiz Type:</span>
                <span class="detail-value">${record.quiz_type}</span>
              </div>`
                : ''
            }
            <div class="detail-row">
              <span class="detail-label">Teacher:</span>
              <span class="detail-value">${record.teacher_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Questions:</span>
              <span class="detail-value">${record.question_count} questions</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Submissions:</span>
              <span class="detail-value">${record.submission_count} submissions</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Schedule</div>
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span class="detail-value">${
                record.start_date ? format(new Date(record.start_date), 'PPpp') : 'Not set'
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">End Date:</span>
              <span class="detail-value">${
                record.end_date ? format(new Date(record.end_date), 'PPpp') : 'Not set'
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">${format(new Date(record.created_at), 'PPpp')}</span>
            </div>
          </div>

          ${questionsHtml}

          <div class="footer">
            <p>This is an official document from the Exam Records Management System</p>
            <p>&copy; ${new Date().getFullYear()} ERMS. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleDownloadPDF = async (record: ExamRecord) => {
    // Fetch full exam details with questions first
    if (record.type === 'exam') {
      try {
        const response = await fetch(`/api/admin/records/${record.id}`)
        if (response.ok) {
          const data = await response.json()
          const fullRecord = data.record
          
          // Use PDF generator for exams with questions
          if (fullRecord.questions && fullRecord.questions.length > 0) {
            const examData = {
              id: fullRecord.id,
              title: fullRecord.title,
              period: fullRecord.period || 'General',
              schoolName: fullRecord.school_name || 'School Name',
              introduction: fullRecord.introduction || '',
              questions: fullRecord.questions
                .sort((a: Question, b: Question) => a.order_number - b.order_number)
                .map((q: Question) => ({
                  id: q.id,
                  type: q.question_type,
                  question: q.question,
                  options: q.question_type === 'multiple-choice' && q.options
                    ? getOptionsArray(q.options)
                    : undefined,
                  points: 1, // Default points
                }))
            }
            generateExamPDF(examData, 'download')
            return
          }
        }
      } catch (error) {
        console.error('Failed to fetch exam details for download:', error)
      }
    }

    // Fallback to the original PDF method for non-exams or if fetch failed
    const pdf = new jsPDF()

    // Add header
    pdf.setFontSize(20)
    pdf.setTextColor(22, 163, 74)
    pdf.text('Exam Records Management System', 105, 20, { align: 'center' })

    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('Exam Record Details', 105, 30, { align: 'center' })

    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Generated on ${format(new Date(), 'PPpp')}`, 105, 38, { align: 'center' })

    // Add divider
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(22, 163, 74)
    pdf.line(20, 42, 190, 42)

    let yPosition = 55

    const checkPageBreak = () => {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }
    }

    // Exam Information Section
    pdf.setFontSize(14)
    pdf.setTextColor(22, 163, 74)
    pdf.text('Exam Information', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)

    const addField = (label: string, value: string) => {
      checkPageBreak()
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, 25, yPosition)
      pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(value, 110)
      pdf.text(lines, 80, yPosition)
      yPosition += 7 * lines.length
    }

    addField('Title:', record.title)
    addField('Type:', record.type.toUpperCase())
    if (record.quiz_type) {
      addField('Quiz Type:', record.quiz_type)
    }
    addField('Teacher:', record.teacher_name)
    addField('Questions:', `${record.question_count} questions`)
    addField('Submissions:', `${record.submission_count} submissions`)

    yPosition += 5

    // Schedule Section
    checkPageBreak()
    pdf.setFontSize(14)
    pdf.setTextColor(22, 163, 74)
    pdf.text('Schedule', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)

    addField(
      'Start Date:',
      record.start_date ? format(new Date(record.start_date), 'PPpp') : 'Not set'
    )
    addField('End Date:', record.end_date ? format(new Date(record.end_date), 'PPpp') : 'Not set')
    addField('Created:', format(new Date(record.created_at), 'PPpp'))

    yPosition += 10

    // Questions Section
    if (record.questions && record.questions.length > 0) {
      checkPageBreak()
      pdf.setFontSize(14)
      pdf.setTextColor(22, 163, 74)
      pdf.text('Questions', 20, yPosition)
      yPosition += 8

      const sortedQuestions = [...record.questions].sort((a, b) => a.order_number - b.order_number)

      sortedQuestions.forEach((q, index) => {
        checkPageBreak()
        
        // Question number and type
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(22, 163, 74)
        pdf.text(`Question ${index + 1} (${q.question_type})`, 25, yPosition)
        yPosition += 6

        // Question text
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        const questionLines = pdf.splitTextToSize(q.question, 160)
        questionLines.forEach((line: string) => {
          checkPageBreak()
          pdf.text(line, 25, yPosition)
          yPosition += 5
        })
        yPosition += 2

        // Options for multiple choice
        if (q.question_type === 'multiple-choice' && q.options) {
          const options = getOptionsArray(q.options)
          options.forEach((opt: string, i: number) => {
            checkPageBreak()
            const optionText = `${String.fromCharCode(65 + i)}. ${opt}`
            const optionLines = pdf.splitTextToSize(optionText, 150)
            optionLines.forEach((line: string) => {
              pdf.text(line, 30, yPosition)
              yPosition += 5
            })
          })
          yPosition += 2
        }

        // Answer (if show_answer_key is true)
        if (record.show_answer_key) {
          checkPageBreak()
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(22, 163, 74)
          pdf.text('Answer:', 25, yPosition)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)
          const answerLines = pdf.splitTextToSize(q.correct_answer, 140)
          answerLines.forEach((line: string) => {
            pdf.text(line, 48, yPosition)
            yPosition += 5
          })
        }

        yPosition += 8
      })
    }

    // Add footer on last page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageCount = (pdf as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setLineWidth(0.5)
      pdf.setDrawColor(22, 163, 74)
      pdf.line(20, 280, 190, 280)

      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        'This is an official document from the Exam Records Management System',
        105,
        286,
        { align: 'center' }
      )
      pdf.text(`© ${new Date().getFullYear()} ERMS. All rights reserved.`, 105, 290, {
        align: 'center',
      })
      pdf.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' })
    }

    // Save PDF
    pdf.save(`exam-record-${record.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exam':
        return 'success'
      case 'quiz':
        return 'primary'
      case 'assignment':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Exam Records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage all exams, quizzes, and assignments created by teachers
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by title or teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 250 }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="w-5 h-5 text-gray-400" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="exam">Exam</MenuItem>
              <MenuItem value="quiz">Quiz</MenuItem>
              <MenuItem value="assignment">Assignment</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total Records
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
            {records.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Exams
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, color: 'success.main' }}>
            {records.filter((r) => r.type === 'exam').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Quizzes
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, color: 'primary.main' }}>
            {records.filter((r) => r.type === 'quiz').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Assignments
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, color: 'warning.main' }}>
            {records.filter((r) => r.type === 'assignment').length}
          </Typography>
        </Paper>
      </Box>

      {/* Records Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Teacher</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Questions</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Submissions</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <Typography color="text.secondary">No records found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {record.title}
                    </Typography>
                    {record.quiz_type && (
                      <Typography variant="caption" color="text.secondary">
                        {record.quiz_type}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={record.type} color={getTypeColor(record.type)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <User className="w-4 h-4 text-gray-400" />
                      <Typography variant="body2">{record.teacher_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{record.question_count}</TableCell>
                  <TableCell>{record.submission_count}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <Typography variant="body2">
                        {format(new Date(record.created_at), 'PP')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => handlePreview(record)}>
                          <Eye className="w-4 h-4" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {selectedRecord?.type === 'exam' ? 'Exam Details' : selectedRecord?.type === 'quiz' ? 'Quiz Details' : 'Assignment Details'}
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box>
              {selectedRecord.type === 'exam' && (
                <>
                  <Paper sx={{ p: 3, mb: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {selectedRecord.school_name || 'School Name'}
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                      {selectedRecord.title}
                    </Typography>
                    {selectedRecord.period && (
                      <Chip 
                        label={selectedRecord.period.toUpperCase() + ' EXAMINATION'} 
                        color="success"
                      />
                    )}
                  </Paper>

                  {selectedRecord.introduction && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Instructions
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedRecord.introduction}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Chip label={`Questions: ${selectedRecord.questions?.length || 0}`} />
                    <Chip 
                      label={`Total Points: ${selectedRecord.questions?.reduce((sum) => sum + 1, 0) || 0}`} 
                      color="success" 
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Questions
                  </Typography>
                  {selectedRecord.questions && selectedRecord.questions.length > 0 ? (
                    selectedRecord.questions
                      .sort((a, b) => a.order_number - b.order_number)
                      .map((question, index) => (
                        <Card key={question.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {index + 1}. {question.question}
                              </Typography>
                              <Chip label="1 pts" size="small" color="primary" />
                            </Box>
                            
                            {question.question_type === 'multiple-choice' && question.options && (
                              <Box sx={{ ml: 2, mt: 1 }}>
                                {getOptionsArray(question.options).map((option: string, optIndex: number) => (
                                  <Typography 
                                    key={optIndex} 
                                    variant="body2" 
                                    sx={{ 
                                      py: 0.5,
                                      fontWeight: option === question.correct_answer ? 'bold' : 'normal',
                                      color: option === question.correct_answer ? 'success.main' : 'inherit'
                                    }}
                                  >
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                    {option === question.correct_answer && ' ✓'}
                                  </Typography>
                                ))}
                              </Box>
                            )}

                            {question.question_type === 'true-false' && (
                              <Box sx={{ ml: 2, mt: 1 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: question.correct_answer === 'true' ? 'bold' : 'normal',
                                    color: question.correct_answer === 'true' ? 'success.main' : 'inherit'
                                  }}
                                >
                                  True {question.correct_answer === 'true' && '✓'}
                                </Typography>
                                <Typography 
                                  variant="body2"
                                  sx={{ 
                                    fontWeight: question.correct_answer === 'false' ? 'bold' : 'normal',
                                    color: question.correct_answer === 'false' ? 'success.main' : 'inherit'
                                  }}
                                >
                                  False {question.correct_answer === 'false' && '✓'}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <Typography color="text.secondary">No questions added yet.</Typography>
                  )}

                  {/* Submissions Section for Exams */}
                  {selectedRecord.submissions && selectedRecord.submissions.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Student Submissions ({selectedRecord.submissions.length})
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Submitted At</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedRecord.submissions.map((submission) => (
                              <TableRow key={submission.id}>
                                <TableCell>{submission.student_name}</TableCell>
                                <TableCell>{submission.student_email}</TableCell>
                                <TableCell>{format(new Date(submission.submitted_at), 'PPp')}</TableCell>
                                <TableCell>{submission.score !== null && submission.score !== undefined ? `${submission.score}` : 'Not graded'}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={submission.status} 
                                    size="small" 
                                    color={submission.status === 'submitted' ? 'success' : 'default'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}

              {selectedRecord.type !== 'exam' && (
                <>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                    {selectedRecord.title}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Type
                    </Typography>
                    <Chip label={selectedRecord.type} color={getTypeColor(selectedRecord.type)} />
                  </Box>

                  {selectedRecord.quiz_type && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Quiz Type
                      </Typography>
                      <Typography>{selectedRecord.quiz_type}</Typography>
                    </Box>
                  )}

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Teacher
                    </Typography>
                    <Typography>{selectedRecord.teacher_name}</Typography>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Questions
                      </Typography>
                      <Typography>{selectedRecord.question_count} questions</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Submissions
                      </Typography>
                      <Typography>{selectedRecord.submission_count} submissions</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Start Date
                    </Typography>
                    <Typography>
                      {selectedRecord.start_date
                        ? format(new Date(selectedRecord.start_date), 'PPpp')
                        : 'Not set'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      End Date
                    </Typography>
                    <Typography>
                      {selectedRecord.end_date
                        ? format(new Date(selectedRecord.end_date), 'PPpp')
                        : 'Not set'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Created
                    </Typography>
                    <Typography>{format(new Date(selectedRecord.created_at), 'PPpp')}</Typography>
                  </Box>

                  {/* Submissions Section */}
                  {selectedRecord.submissions && selectedRecord.submissions.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Student Submissions ({selectedRecord.submissions.length})
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Submitted At</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedRecord.submissions.map((submission) => (
                              <TableRow key={submission.id}>
                                <TableCell>{submission.student_name}</TableCell>
                                <TableCell>{submission.student_email}</TableCell>
                                <TableCell>{format(new Date(submission.submitted_at), 'PPp')}</TableCell>
                                <TableCell>{submission.score !== null && submission.score !== undefined ? `${submission.score}` : 'Not graded'}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={submission.status} 
                                    size="small" 
                                    color={submission.status === 'submitted' ? 'success' : 'default'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedRecord?.type === 'exam' && (
            <>
              <Button onClick={() => selectedRecord && handlePrint(selectedRecord)} startIcon={<Printer />} color="secondary">
                Print Preview
              </Button>
              <Button onClick={() => selectedRecord && handleDownloadPDF(selectedRecord)} startIcon={<Download />} color="success">
                Download PDF
              </Button>
            </>
          )}
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
