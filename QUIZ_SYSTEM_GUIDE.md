# Quiz System Implementation Guide

## Overview
A comprehensive quiz, assignment, and exam management system has been added to the teacher dashboard with both manual and AI-powered question generation capabilities.

## Features Implemented

### 1. **Quizzes Module**
- **Quiz Types:**
  - True/False
  - Identification
  - Multiple Choice
- **Creation Methods:**
  - Manual entry with custom questions
  - AI-generated questions using Gemini API
- **Features:**
  - Start/End date scheduling
  - Toggle to show/hide answer key
  - Upload PDF/PPT/TXT files for AI generation
  - Custom topic prompts for AI

### 2. **Assignment Module**
- Create assignment questions
- Students upload their work (files)
- Configure:
  - Allowed file types (.pdf, .doc, .docx, etc.)
  - Maximum file size limit
  - Due dates
  - Description/Instructions

### 3. **Exam Module**
- **Exam Periods:** Prelim, Midterm, Finals
- **Question Types:**
  - Enumeration
  - Multiple Choice
  - Identification
  - True/False
  - Essay
- **Creation Methods:**
  - Manual entry
  - AI-generated using Gemini
- **PDF Generation:**
  - Professional exam format with header
  - School name, exam period, title
  - Student information fields (Name, Course, Date, Score)
  - Introduction/Instructions
  - Grouped questions by type
  - Answer spaces for each question
  - Download and Print functionality

## Files Created

### Frontend Components
- `app/teacher/quiz/page.tsx` - Server component
- `app/teacher/quiz/QuizClient.tsx` - Main client component with tabs
- `app/teacher/quiz/components/QuizzesTab.tsx` - Quiz creation & management
- `app/teacher/quiz/components/AssignmentTab.tsx` - Assignment management
- `app/teacher/quiz/components/ExamTab.tsx` - Exam creation & management
- `app/teacher/quiz/utils/pdfGenerator.ts` - PDF generation utility

### API Routes
- `app/api/teacher/create-quiz/route.ts` - Save quiz to database
- `app/api/teacher/create-assignment/route.ts` - Save assignment to database
- `app/api/teacher/create-exam/route.ts` - Save exam to database
- `app/api/teacher/generate-quiz/route.ts` - AI quiz generation (Gemini)
- `app/api/teacher/generate-exam/route.ts` - AI exam generation (Gemini)

### Database Updates
- Updated `supabase/schema.sql` with new tables:
  - `quizzes` - Quiz metadata
  - `quiz_questions` - Individual quiz questions
  - `assignments` - Assignment metadata
  - `assignment_submissions` - Student submissions
  - `exams` - Exam metadata
  - `exam_questions` - Individual exam questions

## Database Schema

### Quizzes Table
```sql
- id (UUID)
- teacher_id (UUID) → references teachers
- title (TEXT)
- type (TEXT) - 'true-false', 'identification', 'multiple-choice'
- start_date (TIMESTAMP)
- end_date (TIMESTAMP)
- show_answer_key (BOOLEAN)
```

### Quiz Questions Table
```sql
- id (UUID)
- quiz_id (UUID) → references quizzes
- type (TEXT)
- question (TEXT)
- options (JSONB) - for multiple choice
- correct_answer (TEXT)
```

### Assignments Table
```sql
- id (UUID)
- teacher_id (UUID) → references teachers
- title (TEXT)
- description (TEXT)
- due_date (TIMESTAMP)
- allowed_file_types (TEXT[])
- max_file_size (INTEGER) - in MB
```

### Exams Table
```sql
- id (UUID)
- teacher_id (UUID) → references teachers
- title (TEXT)
- period (TEXT) - 'prelim', 'midterm', 'finals'
- school_name (TEXT)
- introduction (TEXT)
```

### Exam Questions Table
```sql
- id (UUID)
- exam_id (UUID) → references exams
- type (TEXT) - 'enumeration', 'multiple-choice', 'identification', 'true-false', 'essay'
- question (TEXT)
- options (JSONB) - for multiple choice
- points (INTEGER)
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install jspdf @react-pdf/renderer
```

### 2. Update Database Schema
Run the updated `supabase/schema.sql` in your Supabase SQL Editor to create the new tables.

### 3. Configure AI Generation (Optional)
To enable Gemini AI integration:

1. Install the Gemini package:
```bash
npm install @google/generative-ai
```

2. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. Add to `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

4. Uncomment the AI generation code in:
   - `app/api/teacher/generate-quiz/route.ts`
   - `app/api/teacher/generate-exam/route.ts`

## Usage

### For Teachers:

1. **Navigate to Quiz Section:**
   - Click "Quiz" in the teacher sidebar
   - Choose between Quizzes, Assignment, or Exam tabs

2. **Create a Quiz:**
   - Click "Create Quiz"
   - Enter title, select type, set dates
   - Choose Manual or AI generation
   - Add/edit questions
   - Save quiz

3. **Create an Assignment:**
   - Click "Create Assignment"
   - Enter title, description, due date
   - Configure file upload settings
   - Save assignment

4. **Create an Exam:**
   - Click "Create Exam"
   - Enter exam details (title, period, school name)
   - Add introduction/instructions
   - Choose Manual or AI generation
   - Add questions of different types
   - Save and download/print PDF

### PDF Exam Format:
```
                San Diego de Alcala School of Calasiao
                        PRELIM EXAMINATION
                    Introduction to Programming

Name: ___________________________    Date: _______________
Course/Year: _____________________    Score: ______________

Instructions here...
─────────────────────────────────────────────────────────

I. ENUMERATION
1. Question text here...
   Answer: _______________________________

II. MULTIPLE CHOICE
1. Question text here...
   A. Option A
   B. Option B
   C. Option C
   D. Option D

III. IDENTIFICATION
...

IV. TRUE OR FALSE
...

V. ESSAY
1. Essay question...
   ________________________________________
   ________________________________________
   ________________________________________
```

## Technical Notes

- **Material-UI** used for all form components and dialogs
- **jsPDF** used for PDF generation
- **Lucide React** icons for UI elements
- Questions support dynamic options for multiple choice
- AI generation accepts PDF, PPT, and TXT file uploads
- PDF automatically groups questions by type with Roman numerals
- All data stored in Supabase PostgreSQL

## Future Enhancements

Potential additions:
- Student quiz-taking interface
- Automatic grading for quizzes
- Analytics and reporting
- Question bank/library
- Quiz results tracking
- Assignment file storage in Supabase Storage
- Export quiz results to Excel
- Quiz timer/countdown
- Randomize question order
- Question difficulty levels

## Navigation
- Sidebar: Teacher Dashboard → Quiz
- Active icon: FileText (lucide-react)

---

**Status:** ✅ Fully Implemented
**Version:** 1.0
**Last Updated:** 2024
