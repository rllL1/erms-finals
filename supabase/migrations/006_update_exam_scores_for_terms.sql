-- =====================================================
-- UPDATE EXAM SCORES TO SUPPORT PRELIM, MIDTERM, FINALS
-- =====================================================

-- Drop the existing constraint
ALTER TABLE student_exam_scores 
  DROP CONSTRAINT IF EXISTS unique_student_exam;

-- Add new columns for prelim, midterm, finals
ALTER TABLE student_exam_scores 
  ADD COLUMN IF NOT EXISTS prelim_score DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS midterm_score DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS finals_score DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS max_prelim_score DECIMAL(5, 2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS max_midterm_score DECIMAL(5, 2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS max_finals_score DECIMAL(5, 2) DEFAULT 100.00;

-- Update the check constraint for valid scores
ALTER TABLE student_exam_scores 
  DROP CONSTRAINT IF EXISTS valid_exam_score;

ALTER TABLE student_exam_scores 
  ADD CONSTRAINT valid_prelim_score CHECK (
    prelim_score IS NULL OR (prelim_score >= 0 AND prelim_score <= max_prelim_score)
  ),
  ADD CONSTRAINT valid_midterm_score CHECK (
    midterm_score IS NULL OR (midterm_score >= 0 AND midterm_score <= max_midterm_score)
  ),
  ADD CONSTRAINT valid_finals_score CHECK (
    finals_score IS NULL OR (finals_score >= 0 AND finals_score <= max_finals_score)
  );

-- Update the view to calculate average of three exam scores
DROP VIEW IF EXISTS student_overall_grades;

CREATE OR REPLACE VIEW student_overall_grades AS
SELECT
  cs.id AS enrollment_id,
  cs.class_id,
  gc.class_name,
  gc.subject,
  cs.student_id,
  s.student_id AS student_number,
  s.student_name,
  
  -- Quiz average
  (
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 AND SUM(CASE WHEN ss.max_score > 0 THEN ss.max_score ELSE 0 END) > 0
        THEN (SUM(COALESCE(ss.score, 0)) / SUM(CASE WHEN ss.max_score > 0 THEN ss.max_score ELSE 0 END)) * 100
        ELSE 0
      END
    FROM student_submissions ss
    JOIN class_materials cm ON cm.id = ss.material_id
    WHERE cm.class_id = cs.class_id
      AND ss.student_id = cs.student_id
      AND cm.material_type = 'quiz'
      AND ss.is_graded = true
  ) AS quiz_average,
  
  -- Assignment average
  (
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 AND SUM(CASE WHEN ss.max_score > 0 THEN ss.max_score ELSE 0 END) > 0
        THEN (SUM(COALESCE(ss.score, 0)) / SUM(CASE WHEN ss.max_score > 0 THEN ss.max_score ELSE 0 END)) * 100
        ELSE 0
      END
    FROM student_submissions ss
    JOIN class_materials cm ON cm.id = ss.material_id
    WHERE cm.class_id = cs.class_id
      AND ss.student_id = cs.student_id
      AND cm.material_type = 'assignment'
      AND ss.is_graded = true
  ) AS assignment_average,
  
  -- Exam average (average of prelim, midterm, finals)
  (
    SELECT 
      CASE 
        WHEN ses.prelim_score IS NOT NULL OR ses.midterm_score IS NOT NULL OR ses.finals_score IS NOT NULL
        THEN (
          COALESCE(
            CASE WHEN ses.max_prelim_score > 0 THEN (ses.prelim_score / ses.max_prelim_score) * 100 ELSE 0 END, 
            0
          ) +
          COALESCE(
            CASE WHEN ses.max_midterm_score > 0 THEN (ses.midterm_score / ses.max_midterm_score) * 100 ELSE 0 END, 
            0
          ) +
          COALESCE(
            CASE WHEN ses.max_finals_score > 0 THEN (ses.finals_score / ses.max_finals_score) * 100 ELSE 0 END, 
            0
          )
        ) / NULLIF(
          (CASE WHEN ses.prelim_score IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN ses.midterm_score IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN ses.finals_score IS NOT NULL THEN 1 ELSE 0 END), 
          0
        )
        ELSE 0
      END
    FROM student_exam_scores ses
    WHERE ses.class_id = cs.class_id
      AND ses.student_id = cs.student_id
  ) AS exam_average,
  
  -- Raw scores for display
  ses.prelim_score,
  ses.midterm_score,
  ses.finals_score,
  ses.max_prelim_score,
  ses.max_midterm_score,
  ses.max_finals_score,
  
  -- Computation percentages
  gcs.quiz_percentage,
  gcs.assignment_percentage,
  gcs.exam_percentage,
  
  -- Overall grade
  (
    COALESCE(
      (
        SELECT 
          CASE 
            WHEN COUNT(*) > 0 AND SUM(CASE WHEN ss.max_score > 0 THEN ss.max_score ELSE 0 END) > 0
            THEN (SUM(COALESCE(ss.score, 0)) / SUM(CASE WHEN ss.max_score > 0 THEN ss.max_score ELSE 0 END)) * 100
            ELSE 0
          END
        FROM student_submissions ss
        JOIN class_materials cm ON cm.id = ss.material_id
        WHERE cm.class_id = cs.class_id
          AND ss.student_id = cs.student_id
          AND cm.material_type = 'quiz'
          AND ss.is_graded = true
      ) * COALESCE(gcs.quiz_percentage, 30) / 100,
      0
    ) +
    COALESCE(
      (
        SELECT 
          CASE 
            WHEN COUNT(*) > 0 AND SUM(CASE WHEN ss.max_score > 0 THEN ss.max_score ELSE 0 END) > 0
            THEN (SUM(COALESCE(ss.score, 0)) / SUM(CASE WHEN ss.max_score > 0 THEN ss.max_score ELSE 0 END)) * 100
            ELSE 0
          END
        FROM student_submissions ss
        JOIN class_materials cm ON cm.id = ss.material_id
        WHERE cm.class_id = cs.class_id
          AND ss.student_id = cs.student_id
          AND cm.material_type = 'assignment'
          AND ss.is_graded = true
      ) * COALESCE(gcs.assignment_percentage, 30) / 100,
      0
    ) +
    COALESCE(
      (
        SELECT 
          CASE 
            WHEN ses.prelim_score IS NOT NULL OR ses.midterm_score IS NOT NULL OR ses.finals_score IS NOT NULL
            THEN (
              COALESCE(
                CASE WHEN ses.max_prelim_score > 0 THEN (ses.prelim_score / ses.max_prelim_score) * 100 ELSE 0 END, 
                0
              ) +
              COALESCE(
                CASE WHEN ses.max_midterm_score > 0 THEN (ses.midterm_score / ses.max_midterm_score) * 100 ELSE 0 END, 
                0
              ) +
              COALESCE(
                CASE WHEN ses.max_finals_score > 0 THEN (ses.finals_score / ses.max_finals_score) * 100 ELSE 0 END, 
                0
              )
            ) / NULLIF(
              (CASE WHEN ses.prelim_score IS NOT NULL THEN 1 ELSE 0 END +
               CASE WHEN ses.midterm_score IS NOT NULL THEN 1 ELSE 0 END +
               CASE WHEN ses.finals_score IS NOT NULL THEN 1 ELSE 0 END), 
              0
            )
            ELSE 0
          END
        FROM student_exam_scores ses
        WHERE ses.class_id = cs.class_id
          AND ses.student_id = cs.student_id
      ) * COALESCE(gcs.exam_percentage, 40) / 100,
      0
    )
  ) AS overall_grade
  
FROM class_students cs
JOIN group_classes gc ON gc.id = cs.class_id
JOIN students s ON s.id = cs.student_id
LEFT JOIN student_exam_scores ses ON ses.class_id = cs.class_id AND ses.student_id = cs.student_id
LEFT JOIN grade_computation_settings gcs ON gcs.class_id = cs.class_id
ORDER BY s.student_name;
