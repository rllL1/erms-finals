-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
-- This migration creates the audit_logs table for tracking system activities

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'teacher', 'student')),
  action TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'login', 'logout', 'access', 'system')),
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'warning')) DEFAULT 'success',
  details TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE audit_logs IS 'Stores comprehensive audit trail of all system activities';
