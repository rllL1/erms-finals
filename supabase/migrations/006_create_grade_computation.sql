-- ============================================
-- Grade Computation System Migration
-- ============================================
-- New grading categories: Affective (10%), Summative (50%), Formative (40%)
-- Per-term scoring: Prelim, Midterm, Finals
-- Final Grade = ((Prelim + Midterm) / 2 + Finals) / 2

-- 1. Create grade_manual_scores table for per-student, per-term manual scores
CREATE TABLE IF NOT EXISTS grade_manual_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term TEXT NOT NULL CHECK (term IN ('prelim', 'midterm', 'finals')),
  affective_score NUMERIC(5,2) CHECK (affective_score >= 0 AND affective_score <= 100),
  summative_score NUMERIC(5,2) CHECK (summative_score >= 0 AND summative_score <= 100),
  formative_score NUMERIC(5,2) CHECK (formative_score >= 0 AND formative_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id, term)
);

-- 2. Create grade_computation_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS grade_computation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE UNIQUE,
  quiz_percentage NUMERIC(5,2) DEFAULT 10,
  assignment_percentage NUMERIC(5,2) DEFAULT 50,
  exam_percentage NUMERIC(5,2) DEFAULT 40,
  affective_percentage NUMERIC(5,2) DEFAULT 10,
  summative_percentage NUMERIC(5,2) DEFAULT 50,
  formative_percentage NUMERIC(5,2) DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. If table already existed, add the new columns
ALTER TABLE grade_computation_settings
  ADD COLUMN IF NOT EXISTS affective_percentage NUMERIC(5,2) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS summative_percentage NUMERIC(5,2) DEFAULT 50,
  ADD COLUMN IF NOT EXISTS formative_percentage NUMERIC(5,2) DEFAULT 40;

-- 3. Enable RLS on grade_manual_scores
ALTER TABLE grade_manual_scores ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for grade_manual_scores
-- Teachers can view scores for their classes
CREATE POLICY "Teachers can view grade_manual_scores" ON grade_manual_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON gc.teacher_id = t.id
      JOIN profiles p ON t.user_id = p.id
      WHERE gc.id = grade_manual_scores.class_id
      AND p.id = auth.uid()
    )
  );

-- Teachers can insert scores for their classes
CREATE POLICY "Teachers can insert grade_manual_scores" ON grade_manual_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON gc.teacher_id = t.id
      JOIN profiles p ON t.user_id = p.id
      WHERE gc.id = grade_manual_scores.class_id
      AND p.id = auth.uid()
    )
  );

-- Teachers can update scores for their classes
CREATE POLICY "Teachers can update grade_manual_scores" ON grade_manual_scores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON gc.teacher_id = t.id
      JOIN profiles p ON t.user_id = p.id
      WHERE gc.id = grade_manual_scores.class_id
      AND p.id = auth.uid()
    )
  );

-- Teachers can delete scores for their classes
CREATE POLICY "Teachers can delete grade_manual_scores" ON grade_manual_scores
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_classes gc
      JOIN teachers t ON gc.teacher_id = t.id
      JOIN profiles p ON t.user_id = p.id
      WHERE gc.id = grade_manual_scores.class_id
      AND p.id = auth.uid()
    )
  );

-- Students can view their own scores
CREATE POLICY "Students can view own grade_manual_scores" ON grade_manual_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = grade_manual_scores.student_id
      AND s.user_id = auth.uid()
    )
  );

-- 5. Enable RLS on grade_computation_settings
ALTER TABLE grade_computation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grade_computation_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can view grade_computation_settings') THEN
    CREATE POLICY "Teachers can view grade_computation_settings" ON grade_computation_settings
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM group_classes gc
          JOIN teachers t ON gc.teacher_id = t.id
          WHERE gc.id = grade_computation_settings.class_id
          AND t.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can insert grade_computation_settings') THEN
    CREATE POLICY "Teachers can insert grade_computation_settings" ON grade_computation_settings
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM group_classes gc
          JOIN teachers t ON gc.teacher_id = t.id
          WHERE gc.id = grade_computation_settings.class_id
          AND t.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can update grade_computation_settings') THEN
    CREATE POLICY "Teachers can update grade_computation_settings" ON grade_computation_settings
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM group_classes gc
          JOIN teachers t ON gc.teacher_id = t.id
          WHERE gc.id = grade_computation_settings.class_id
          AND t.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 6. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_grade_manual_scores_class_id ON grade_manual_scores(class_id);
CREATE INDEX IF NOT EXISTS idx_grade_manual_scores_student_id ON grade_manual_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_manual_scores_class_student ON grade_manual_scores(class_id, student_id);
CREATE INDEX IF NOT EXISTS idx_grade_computation_settings_class_id ON grade_computation_settings(class_id);
