-- Migration: Group Class System
-- Description: Tables for teacher-student class management, materials, and submissions

-- =====================================================
-- 1. GROUP CLASSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS group_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  class_start_time TIME NOT NULL,
  class_end_time TIME NOT NULL,
  teacher_name VARCHAR(255) NOT NULL,
  class_code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (class_end_time > class_start_time),
  CONSTRAINT unique_teacher_subject UNIQUE (teacher_id, subject),
  CONSTRAINT unique_teacher_time UNIQUE (teacher_id, class_start_time, class_end_time)
);

-- Index for faster lookups
CREATE INDEX idx_group_classes_teacher ON group_classes(teacher_id);
CREATE INDEX idx_group_classes_code ON group_classes(class_code);

-- =====================================================
-- 2. CLASS STUDENTS (JUNCTION TABLE)
-- =====================================================
CREATE TABLE IF NOT EXISTS class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one student joins a class only once
  CONSTRAINT unique_class_student UNIQUE (class_id, student_id)
);

-- Indexes for faster queries
CREATE INDEX idx_class_students_class ON class_students(class_id);
CREATE INDEX idx_class_students_student ON class_students(student_id);

-- =====================================================
-- 3. CLASS MATERIALS (QUIZZES/ASSIGNMENTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE,
  material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('quiz', 'assignment')),
  
  -- Reference to existing quiz/assignment
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,

  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit INTEGER, -- in minutes
  due_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure quiz_id is set for both quiz and assignment types
  CONSTRAINT material_reference_check CHECK (quiz_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_class_materials_class ON class_materials(class_id);
CREATE INDEX idx_class_materials_quiz ON class_materials(quiz_id);

-- =====================================================
-- 4. STUDENT SUBMISSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS student_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES class_materials(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Quiz responses (JSON format for answers)
  quiz_answers JSONB,
  
  -- Assignment file/response
  assignment_response TEXT,
  assignment_file_url TEXT,
  
  -- Scoring
  score DECIMAL(5, 2),
  max_score DECIMAL(5, 2),
  is_graded BOOLEAN DEFAULT FALSE,
  auto_graded BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded')),
  
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES teachers(id),
  
  -- Prevent multiple submissions (unless retake is allowed)
  CONSTRAINT unique_student_submission UNIQUE (material_id, student_id)
);

-- Indexes
CREATE INDEX idx_submissions_material ON student_submissions(material_id);
CREATE INDEX idx_submissions_student ON student_submissions(student_id);
CREATE INDEX idx_submissions_status ON student_submissions(status);

-- =====================================================
-- 5. QUIZ ATTEMPTS (for tracking multiple attempts if allowed)
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES student_submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  
  answers JSONB NOT NULL,
  score DECIMAL(5, 2),
  max_score DECIMAL(5, 2),
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken INTEGER, -- in seconds
  
  is_completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_quiz_attempts_submission ON quiz_attempts(submission_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function to generate unique class code
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM group_classes WHERE class_code = code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_group_classes_updated_at
  BEFORE UPDATE ON group_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_materials_updated_at
  BEFORE UPDATE ON class_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE group_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- GROUP CLASSES POLICIES

-- Teachers can view their own classes
CREATE POLICY "Teachers can view own classes"
  ON group_classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = group_classes.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Teachers can create classes
CREATE POLICY "Teachers can create classes"
  ON group_classes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Teachers can update their own classes
CREATE POLICY "Teachers can update own classes"
  ON group_classes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = group_classes.teacher_id
      AND teachers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Teachers can delete their own classes
CREATE POLICY "Teachers can delete own classes"
  ON group_classes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = group_classes.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Students can view classes they've joined
CREATE POLICY "Students can view joined classes"
  ON group_classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students
      JOIN students ON students.id = class_students.student_id
      WHERE class_students.class_id = group_classes.id
      AND students.user_id = auth.uid()
    )
  );

-- CLASS STUDENTS POLICIES

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view class students"
  ON class_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_classes
      JOIN teachers ON teachers.id = group_classes.teacher_id
      WHERE group_classes.id = class_students.class_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Students can view their class memberships
CREATE POLICY "Students can view own class memberships"
  ON class_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = class_students.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Students can join classes
CREATE POLICY "Students can join classes"
  ON class_students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.user_id = auth.uid()
    )
  );

-- Students can leave classes (optional)
CREATE POLICY "Students can leave classes"
  ON class_students FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = class_students.student_id
      AND students.user_id = auth.uid()
    )
  );

-- CLASS MATERIALS POLICIES

-- Teachers can manage materials in their classes
CREATE POLICY "Teachers can view class materials"
  ON class_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_classes
      JOIN teachers ON teachers.id = group_classes.teacher_id
      WHERE group_classes.id = class_materials.class_id
      AND teachers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create class materials"
  ON class_materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_classes
      JOIN teachers ON teachers.id = group_classes.teacher_id
      WHERE group_classes.id = class_materials.class_id
      AND teachers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update class materials"
  ON class_materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_classes
      JOIN teachers ON teachers.id = group_classes.teacher_id
      WHERE group_classes.id = class_materials.class_id
      AND teachers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete class materials"
  ON class_materials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_classes
      JOIN teachers ON teachers.id = group_classes.teacher_id
      WHERE group_classes.id = class_materials.class_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Students can view materials in their classes
CREATE POLICY "Students can view class materials"
  ON class_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students
      JOIN students ON students.id = class_students.student_id
      WHERE class_students.class_id = class_materials.class_id
      AND students.user_id = auth.uid()
    )
  );

-- STUDENT SUBMISSIONS POLICIES

-- Teachers can view submissions for their class materials
CREATE POLICY "Teachers can view submissions"
  ON student_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_materials cm
      JOIN group_classes gc ON gc.id = cm.class_id
      JOIN teachers t ON t.id = gc.teacher_id
      WHERE cm.id = student_submissions.material_id
      AND t.user_id = auth.uid()
    )
  );

-- Teachers can update/grade submissions
CREATE POLICY "Teachers can grade submissions"
  ON student_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM class_materials cm
      JOIN group_classes gc ON gc.id = cm.class_id
      JOIN teachers t ON t.id = gc.teacher_id
      WHERE cm.id = student_submissions.material_id
      AND t.user_id = auth.uid()
    )
  );

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
  ON student_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_submissions.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Students can create submissions
CREATE POLICY "Students can create submissions"
  ON student_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.user_id = auth.uid()
    )
  );

-- QUIZ ATTEMPTS POLICIES

-- Teachers can view attempts for their quizzes
CREATE POLICY "Teachers can view quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN teachers t ON t.id = q.teacher_id
      WHERE q.id = quiz_attempts.quiz_id
      AND t.user_id = auth.uid()
    )
  );

-- Students can view their own attempts
CREATE POLICY "Students can view own attempts"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = quiz_attempts.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Students can create attempts
CREATE POLICY "Students can create attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.user_id = auth.uid()
    )
  );

-- Students can update their own incomplete attempts
CREATE POLICY "Students can update own attempts"
  ON quiz_attempts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = quiz_attempts.student_id
      AND students.user_id = auth.uid()
    )
    AND is_completed = FALSE
  );

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON group_classes TO authenticated;
GRANT ALL ON class_students TO authenticated;
GRANT ALL ON class_materials TO authenticated;
GRANT ALL ON student_submissions TO authenticated;
GRANT ALL ON quiz_attempts TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
