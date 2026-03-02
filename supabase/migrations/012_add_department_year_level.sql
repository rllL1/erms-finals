-- Add department and year_level columns to group_classes
ALTER TABLE public.group_classes
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS year_level TEXT;
