-- Migration: Add attachment support to quizzes table for assignment file uploads
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attachment_name TEXT;
