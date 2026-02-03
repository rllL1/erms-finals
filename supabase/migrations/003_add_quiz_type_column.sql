-- Add missing quiz_type column to quizzes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='quizzes' AND column_name='quiz_type') THEN
    ALTER TABLE quizzes ADD COLUMN quiz_type TEXT;
  END IF;
END $$;

-- Add constraint for quiz_type values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                 WHERE conname = 'quizzes_quiz_type_check') THEN
    ALTER TABLE quizzes ADD CONSTRAINT quizzes_quiz_type_check 
    CHECK (quiz_type IN ('true-false', 'identification', 'multiple-choice') OR quiz_type IS NULL);
  END IF;
END $$;
