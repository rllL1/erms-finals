-- Migration: Add feedback to student_submissions and approval status to class_students
-- Date: 2026-02-23

-- ============================================================
-- Feature 1: Teacher Feedback on Submissions
-- ============================================================

-- Add feedback column to student_submissions
ALTER TABLE student_submissions 
ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT NULL;

-- ============================================================
-- Feature 2: Group Class Join Approval System
-- ============================================================

-- Add status column to class_students with default 'pending'
ALTER TABLE class_students 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'denied'));

-- Update existing enrollments to 'approved' (they were auto-approved before this feature)
UPDATE class_students SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_class_students_status ON class_students(class_id, status);
