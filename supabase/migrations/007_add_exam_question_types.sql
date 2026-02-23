-- Migration: Add 'enumeration' and 'math' to quiz_questions question_type check constraint
-- This allows the exam creation feature to use these additional question types

-- Drop the existing check constraint
ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_question_type_check;

-- Re-create the check constraint with the additional types
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_question_type_check 
  CHECK (question_type IN ('multiple-choice', 'true-false', 'identification', 'essay', 'enumeration', 'math'));
