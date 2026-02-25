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

  // Define the canonical order of exam sections
  const sectionOrder = [
    'enumeration',
    'multiple-choice',
    'identification',
    'true-false',
    'essay',
  ]

  // Human-readable labels (without numeral — numeral is assigned dynamically)
  const sectionNames: { [key: string]: string } = {
    'enumeration': 'ENUMERATION',
    'multiple-choice': 'MULTIPLE CHOICE',
    'identification': 'IDENTIFICATION',
    'true-false': 'TRUE OR FALSE',
    'essay': 'ESSAY',
  }

  // Roman numerals helper
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

  // Build ordered list of sections that actually have questions, assigning sequential Roman numerals
  const orderedSections: { type: string; label: string; questions: ExamQuestion[] }[] = []
  let sectionIndex = 0

  // First, add sections that appear in the canonical order
  for (const type of sectionOrder) {
    if (questionsByType[type] && questionsByType[type].length > 0) {
      const numeral = romanNumerals[sectionIndex] || `${sectionIndex + 1}`
      orderedSections.push({
        type,
        label: `${numeral}. ${sectionNames[type] || type.toUpperCase()}`,
        questions: questionsByType[type],
      })
      sectionIndex++
    }
  }

  // Then, add any remaining types not in the canonical order (future-proof)
  for (const type of Object.keys(questionsByType)) {
    if (!sectionOrder.includes(type) && questionsByType[type].length > 0) {
      const numeral = romanNumerals[sectionIndex] || `${sectionIndex + 1}`
      orderedSections.push({
        type,
        label: `${numeral}. ${type.toUpperCase()}`,
        questions: questionsByType[type],
      })
      sectionIndex++
    }
  }

  let questionNumber = 1

  // Render each section in the correct order
  orderedSections.forEach(({ type, label, questions }) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    // Section Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(label, 20, yPosition)
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
