-- =============================================
-- QUIZZES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('quiz', 'assignment', 'exam')),
  quiz_type TEXT CHECK (quiz_type IN ('true-false', 'identification', 'multiple-choice')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  show_answer_key BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- QUIZ QUESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('true-false', 'identification', 'multiple-choice')),
  question TEXT NOT NULL,
  options JSONB, -- For multiple choice options
  correct_answer TEXT NOT NULL,
  order_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quiz tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Quiz policies (drop if exists first)
DROP POLICY IF EXISTS "Teachers can view their own quizzes" ON quizzes;
CREATE POLICY "Teachers can view their own quizzes"
  ON quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = quizzes.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can insert their own quizzes" ON quizzes;
CREATE POLICY "Teachers can insert their own quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = quizzes.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can update their own quizzes" ON quizzes;
CREATE POLICY "Teachers can update their own quizzes"
  ON quizzes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = quizzes.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can delete their own quizzes" ON quizzes;
CREATE POLICY "Teachers can delete their own quizzes"
  ON quizzes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = quizzes.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Quiz questions policies (drop if exists first)
DROP POLICY IF EXISTS "Teachers can view questions from their own quizzes" ON quiz_questions;
CREATE POLICY "Teachers can view questions from their own quizzes"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN teachers ON teachers.id = quizzes.teacher_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND teachers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can insert questions to their own quizzes" ON quiz_questions;
CREATE POLICY "Teachers can insert questions to their own quizzes"
  ON quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN teachers ON teachers.id = quizzes.teacher_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND teachers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can update questions from their own quizzes" ON quiz_questions;
CREATE POLICY "Teachers can update questions from their own quizzes"
  ON quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN teachers ON teachers.id = quizzes.teacher_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND teachers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can delete questions from their own quizzes" ON quiz_questions;
CREATE POLICY "Teachers can delete questions from their own quizzes"
  ON quiz_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN teachers ON teachers.id = quizzes.teacher_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Indexes for quiz tables
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher_id ON quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_type ON quizzes(type);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- Triggers for quiz tables (drop if exists first)
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
