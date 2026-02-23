-- Migration: Create quiz_progress table for draft answer persistence
-- This allows students to resume quizzes after page refresh without losing answers

CREATE TABLE IF NOT EXISTS quiz_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    material_id UUID NOT NULL,
    quiz_id UUID NOT NULL,
    answers JSONB DEFAULT '{}'::jsonb,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each student can only have one draft per material/quiz
    UNIQUE(student_id, material_id)
);

-- Index for fast lookups by student + material
CREATE INDEX IF NOT EXISTS idx_quiz_progress_student_material 
    ON quiz_progress(student_id, material_id);

-- Enable RLS
ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;

-- Students can see only their own progress
CREATE POLICY "Students can view their own quiz progress"
    ON quiz_progress FOR SELECT
    USING (auth.uid() = student_id);

-- Students can insert their own progress
CREATE POLICY "Students can insert their own quiz progress"
    ON quiz_progress FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Students can update their own progress
CREATE POLICY "Students can update their own quiz progress"
    ON quiz_progress FOR UPDATE
    USING (auth.uid() = student_id);

-- Students can delete their own progress
CREATE POLICY "Students can delete their own quiz progress"
    ON quiz_progress FOR DELETE
    USING (auth.uid() = student_id);
