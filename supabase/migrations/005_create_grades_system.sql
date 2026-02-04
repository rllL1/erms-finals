-- Migration: Grades System
-- Description: Tables for managing student exam scores and grade computation

-- =====================================================
-- 1. GRADE COMPUTATION SETTINGS TABLE
-- =====================================================
-- Store the weightage/percentage for quizzes, assignments, and exams per class
CREATE TABLE IF NOT EXISTS grade_computation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE,
  
  -- Percentage weights (should total 100)
  quiz_percentage DECIMAL(5, 2) DEFAULT 30.00,
  assignment_percentage DECIMAL(5, 2) DEFAULT 30.00,
  exam_percentage DECIMAL(5, 2) DEFAULT 40.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one setting per class
  CONSTRAINT unique_class_settings UNIQUE (class_id),
  
  -- Ensure percentages add up to 100
  CONSTRAINT valid_percentages CHECK (
    quiz_percentage + assignment_percentage + exam_percentage = 100
  ),
  
  -- Ensure non-negative percentages
  CONSTRAINT non_negative_percentages CHECK (
    quiz_percentage >= 0 AND 
    assignment_percentage >= 0 AND 
    exam_percentage >= 0
  )
);

CREATE INDEX idx_grade_settings_class ON grade_computation_settings(class_id);

-- =====================================================
-- 2. STUDENT EXAM SCORES TABLE
-- =====================================================
-- Store exam scores manually inputted by teachers
CREATE TABLE IF NOT EXISTS student_exam_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Exam details
  exam_name VARCHAR(255) NOT NULL DEFAULT 'Exam',
  exam_score DECIMAL(5, 2),
  max_exam_score DECIMAL(5, 2) DEFAULT 100.00,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_by UUID REFERENCES teachers(id),
  
  -- Ensure one exam score per student per class
  CONSTRAINT unique_student_exam UNIQUE (class_id, student_id),
  
  -- Ensure valid score range
  CONSTRAINT valid_exam_score CHECK (
    exam_score IS NULL OR (exam_score >= 0 AND exam_score <= max_exam_score)
  )
);

CREATE INDEX idx_exam_scores_class ON student_exam_scores(class_id);
CREATE INDEX idx_exam_scores_student ON student_exam_scores(student_id);

-- =====================================================
-- 3. STUDENT OVERALL GRADES VIEW
-- =====================================================
-- View to compute overall grades automatically
CREATE OR REPLACE VIEW student_overall_grades AS
SELECT
  cs.id AS enrollment_id,
  cs.class_id,
  gc.class_name,
  gc.subject,
  cs.student_id,
  s.student_id AS student_number,
  s.student_name,
  
  -- Grade computation settings
  COALESCE(gcs.quiz_percentage, 30.00) AS quiz_weight,
  COALESCE(gcs.assignment_percentage, 30.00) AS assignment_weight,
  COALESCE(gcs.exam_percentage, 40.00) AS exam_weight,
  
  -- Quiz average
  (
    SELECT COALESCE(AVG(
      CASE 
        WHEN ss.is_graded = true AND ss.max_score > 0 
        THEN (ss.score / ss.max_score) * 100 
        ELSE NULL 
      END
    ), 0)
    FROM student_submissions ss
    JOIN class_materials cm ON cm.id = ss.material_id
    WHERE ss.student_id = cs.student_id
      AND cm.class_id = cs.class_id
      AND cm.material_type = 'quiz'
      AND ss.is_graded = true
  ) AS quiz_average,
  
  -- Assignment average
  (
    SELECT COALESCE(AVG(
      CASE 
        WHEN ss.is_graded = true AND ss.max_score > 0 
        THEN (ss.score / ss.max_score) * 100 
        ELSE NULL 
      END
    ), 0)
    FROM student_submissions ss
    JOIN class_materials cm ON cm.id = ss.material_id
    WHERE ss.student_id = cs.student_id
      AND cm.class_id = cs.class_id
      AND cm.material_type = 'assignment'
      AND ss.is_graded = true
  ) AS assignment_average,
  
  -- Exam score percentage
  CASE 
    WHEN ses.max_exam_score > 0 
    THEN (ses.exam_score / ses.max_exam_score) * 100 
    ELSE 0 
  END AS exam_percentage,
  
  -- Raw scores for display
  ses.exam_score AS raw_exam_score,
  ses.max_exam_score AS max_exam_score,
  
  -- Overall grade computation
  (
    -- Quiz component
    (
      SELECT COALESCE(AVG(
        CASE 
          WHEN ss.is_graded = true AND ss.max_score > 0 
          THEN (ss.score / ss.max_score) * 100 
          ELSE NULL 
        END
      ), 0)
      FROM student_submissions ss
      JOIN class_materials cm ON cm.id = ss.material_id
      WHERE ss.student_id = cs.student_id
        AND cm.class_id = cs.class_id
        AND cm.material_type = 'quiz'
        AND ss.is_graded = true
    ) * (COALESCE(gcs.quiz_percentage, 30.00) / 100)
    +
    -- Assignment component
    (
      SELECT COALESCE(AVG(
        CASE 
          WHEN ss.is_graded = true AND ss.max_score > 0 
          THEN (ss.score / ss.max_score) * 100 
          ELSE NULL 
        END
      ), 0)
      FROM student_submissions ss
      JOIN class_materials cm ON cm.id = ss.material_id
      WHERE ss.student_id = cs.student_id
        AND cm.class_id = cs.class_id
        AND cm.material_type = 'assignment'
        AND ss.is_graded = true
    ) * (COALESCE(gcs.assignment_percentage, 30.00) / 100)
    +
    -- Exam component
    CASE 
      WHEN ses.max_exam_score > 0 
      THEN (ses.exam_score / ses.max_exam_score) * 100 * (COALESCE(gcs.exam_percentage, 40.00) / 100)
      ELSE 0 
    END
  ) AS overall_grade,
  
  cs.joined_at
FROM class_students cs
JOIN students s ON s.id = cs.student_id
JOIN group_classes gc ON gc.id = cs.class_id
LEFT JOIN grade_computation_settings gcs ON gcs.class_id = cs.class_id
LEFT JOIN student_exam_scores ses ON ses.class_id = cs.class_id AND ses.student_id = cs.student_id;

-- =====================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE grade_computation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_scores ENABLE ROW LEVEL SECURITY;

-- Grade computation settings policies
CREATE POLICY "Teachers can view settings for their classes"
  ON grade_computation_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON t.id = gc.teacher_id
      WHERE gc.id = grade_computation_settings.class_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert settings for their classes"
  ON grade_computation_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON t.id = gc.teacher_id
      WHERE gc.id = grade_computation_settings.class_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update settings for their classes"
  ON grade_computation_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON t.id = gc.teacher_id
      WHERE gc.id = grade_computation_settings.class_id
      AND t.user_id = auth.uid()
    )
  );

-- Exam scores policies
CREATE POLICY "Teachers can view exam scores for their classes"
  ON student_exam_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON t.id = gc.teacher_id
      WHERE gc.id = student_exam_scores.class_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own exam scores"
  ON student_exam_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_exam_scores.student_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert exam scores for their classes"
  ON student_exam_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON t.id = gc.teacher_id
      WHERE gc.id = student_exam_scores.class_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update exam scores for their classes"
  ON student_exam_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON t.id = gc.teacher_id
      WHERE gc.id = student_exam_scores.class_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete exam scores for their classes"
  ON student_exam_scores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON t.id = gc.teacher_id
      WHERE gc.id = student_exam_scores.class_id
      AND t.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_grade_settings_updated_at ON grade_computation_settings;
CREATE TRIGGER update_grade_settings_updated_at
  BEFORE UPDATE ON grade_computation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_scores_updated_at ON student_exam_scores;
CREATE TRIGGER update_exam_scores_updated_at
  BEFORE UPDATE ON student_exam_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
