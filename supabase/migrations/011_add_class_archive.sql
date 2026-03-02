-- Migration: Add archive support for group classes
-- Adds archived_at and auto_delete_at columns to group_classes table

ALTER TABLE group_classes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE group_classes ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient queries on archived status
CREATE INDEX IF NOT EXISTS idx_group_classes_archived ON group_classes (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_classes_auto_delete ON group_classes (auto_delete_at) WHERE auto_delete_at IS NOT NULL;
