import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rhwgkinajlfuefmslbbb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJod2draW5hamxmdWVmbXNsYmJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMTQzNjEsImV4cCI6MjA4NTU5MDM2MX0.GDd2lHyeDRWSoVpW5jNmt-5ktB-TVOgU8FUIgbrUiUs'

const supabase = createClient(supabaseUrl, supabaseKey)

const sql = `
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'login', 'logout', 'access', 'system')),
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'warning')),
  details TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON public.audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON public.audit_logs(user_role);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
`

console.log('\n🔍 Audit Logs Table Migration\n')
console.log('📋 Please run the following SQL in your Supabase SQL Editor:\n')
console.log('============================================================\n')
console.log(sql)
console.log('\n============================================================\n')
console.log('✅ Copy the SQL above and run it in Supabase SQL Editor')
console.log('🔗 Go to: https://supabase.com/dashboard/project/rhwgkinajlfuefmslbbb/sql/new\n')
