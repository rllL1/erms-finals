import jsPDF from 'jspdf'

interface ExamQuestion {
  id: string
  type: string
  question: string
  options?: string[]
  points: number
}

interface Exam {
  id: string
  title: string
  period: string
  schoolName: string
  introduction: string
  questions: ExamQuestion[]
}

export function generateExamPDF(exam: Exam, action: 'download' | 'print') {
  const doc = new jsPDF()
  let yPosition = 20

  // Header - School Name (Centered)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  const schoolNameWidth = doc.getTextWidth(exam.schoolName)
  doc.text(exam.schoolName, (210 - schoolNameWidth) / 2, yPosition)
  yPosition += 10

  // Exam Period (Centered)
  doc.setFontSize(14)
  const periodText = `${exam.period.toUpperCase()} EXAMINATION`
  const periodWidth = doc.getTextWidth(periodText)
  doc.text(periodText, (210 - periodWidth) / 2, yPosition)
  yPosition += 8

  // Exam Title (Centered)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  const titleWidth = doc.getTextWidth(exam.title)
  doc.text(exam.title, (210 - titleWidth) / 2, yPosition)
  yPosition += 15

  // Student Information Fields
  doc.setFontSize(10)
  doc.text('Name: ___________________________________', 20, yPosition)
  doc.text('Date: _______________', 130, yPosition)
  yPosition += 7
  doc.text('Course/Year: ____________________________', 20, yPosition)
  doc.text('Score: ______________', 130, yPosition)
  yPosition += 10

  // Introduction/Instructions
  if (exam.introduction) {
    doc.setFont('helvetica', 'italic')
    const introLines = doc.splitTextToSize(exam.introduction, 170)
    doc.text(introLines, 20, yPosition)
    yPosition += introLines.length * 5 + 5
  }

  // Separator line
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 10

  // Group questions by type
  const questionsByType: { [key: string]: ExamQuestion[] } = {}
  exam.questions.forEach(q => {
    if (!questionsByType[q.type]) {
      questionsByType[q.type] = []
    }
    questionsByType[q.type].push(q)
  })

  // Section labels
  const sectionLabels: { [key: string]: string } = {
    'enumeration': 'I. ENUMERATION',
    'multiple-choice': 'II. MULTIPLE CHOICE',
    'identification': 'III. IDENTIFICATION',
    'true-false': 'IV. TRUE OR FALSE',
    'essay': 'V. ESSAY',
  }

  let questionNumber = 1

  // Render each section
  Object.entries(questionsByType).forEach(([type, questions]) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    // Section Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(sectionLabels[type] || type.toUpperCase(), 20, yPosition)
    yPosition += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    questions.forEach((question) => {
      // Check if we need a new page for this question
      const estimatedHeight = type === 'multiple-choice' ? 25 : 15
      if (yPosition + estimatedHeight > 280) {
        doc.addPage()
        yPosition = 20
      }

      // Question text
      const questionText = `${questionNumber}. ${question.question}`
      const questionLines = doc.splitTextToSize(questionText, 170)
      doc.text(questionLines, 20, yPosition)
      yPosition += questionLines.length * 5

      // Options for multiple choice
      if (type === 'multiple-choice' && question.options) {
        question.options.forEach((option, index) => {
          const optionText = `   ${String.fromCharCode(65 + index)}. ${option}`
          const optionLines = doc.splitTextToSize(optionText, 165)
          doc.text(optionLines, 25, yPosition)
          yPosition += optionLines.length * 5
        })
      } else if (type === 'essay') {
        // Add lines for essay answers
        yPosition += 2
        for (let i = 0; i < 3; i++) {
          doc.line(20, yPosition, 190, yPosition)
          yPosition += 7
        }
      } else {
        // Add answer line for other types
        yPosition += 2
        doc.text('Answer: _________________________________', 25, yPosition)
        yPosition += 7
      }

      yPosition += 3
      questionNumber++
    })

    yPosition += 5
  })

  // Footer
  const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text(`Total Points: ${totalPoints}`, 20, 285)

  // Action
  if (action === 'download') {
    doc.save(`${exam.title.replace(/\s+/g, '_')}_${exam.period}.pdf`)
  } else if (action === 'print') {
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }
}
