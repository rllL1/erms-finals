-- ============================================
-- Grade Details Migration
-- Adds JSONB details column for sub-scores
-- Adds portfolio_score for final grade computation
-- ============================================

-- 1. Add details JSONB column to grade_manual_scores for storing sub-scores
-- Details stores: { att, wrk, peer, sup, hs, rec, pt, sw, qs, exam1, exam2 }
ALTER TABLE grade_manual_scores ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- 2. Add portfolio_score to student_exam_scores for final grade computation
ALTER TABLE student_exam_scores ADD COLUMN IF NOT EXISTS portfolio_score NUMERIC(5,2) CHECK (portfolio_score >= 0 AND portfolio_score <= 100);
