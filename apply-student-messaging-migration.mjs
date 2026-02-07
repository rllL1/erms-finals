import { createClient } from '@supabase/supabase-js'

// Read credentials from .env.local
const supabaseUrl = 'https://rhwgkinajlfuefmslbbb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJod2draW5hamxmdWVmbXNsYmJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMTQzNjEsImV4cCI6MjA4NTU5MDM2MX0.GDd2lHyeDRWSoVpW5jNmt-5ktB-TVOgU8FUIgbrUiUs'

console.log('\n🚀 Student-Teacher Messaging System Migration\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('📋 Creating student_teacher_messages table...\n')

  // Create the student_teacher_messages table
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create student_teacher_messages table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.student_teacher_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id UUID NOT NULL REFERENCES public.group_classes(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
        teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for faster lookups
      CREATE INDEX IF NOT EXISTS idx_stm_class_id ON public.student_teacher_messages(class_id);
      CREATE INDEX IF NOT EXISTS idx_stm_student_id ON public.student_teacher_messages(student_id);
      CREATE INDEX IF NOT EXISTS idx_stm_teacher_id ON public.student_teacher_messages(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_stm_sender_id ON public.student_teacher_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_stm_created_at ON public.student_teacher_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_stm_is_read ON public.student_teacher_messages(is_read);

      -- Enable RLS
      ALTER TABLE public.student_teacher_messages ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DROP POLICY IF EXISTS "Students can view their own messages" ON public.student_teacher_messages;
      CREATE POLICY "Students can view their own messages" ON public.student_teacher_messages
        FOR SELECT USING (
          sender_id = auth.uid() OR
          student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Teachers can view messages for their classes" ON public.student_teacher_messages;
      CREATE POLICY "Teachers can view messages for their classes" ON public.student_teacher_messages
        FOR SELECT USING (
          sender_id = auth.uid() OR
          teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can insert messages" ON public.student_teacher_messages;
      CREATE POLICY "Users can insert messages" ON public.student_teacher_messages
        FOR INSERT WITH CHECK (sender_id = auth.uid());

      DROP POLICY IF EXISTS "Users can update their received messages" ON public.student_teacher_messages;
      CREATE POLICY "Users can update their received messages" ON public.student_teacher_messages
        FOR UPDATE USING (
          student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR
          teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
        );

      -- Enable realtime
      ALTER PUBLICATION supabase_realtime ADD TABLE public.student_teacher_messages;
    `
  })

  if (tableError) {
    console.log('⚠️  RPC not available, trying direct SQL approach...\n')
    
    // Try creating table directly
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS student_teacher_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id UUID NOT NULL,
        student_id UUID NOT NULL,
        teacher_id UUID NOT NULL,
        sender_id UUID NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    console.log('📝 Please run the following SQL in your Supabase SQL Editor:\n')
    console.log('=' .repeat(60))
    console.log(`
-- Create student_teacher_messages table
CREATE TABLE IF NOT EXISTS public.student_teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.group_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_stm_class_id ON public.student_teacher_messages(class_id);
CREATE INDEX IF NOT EXISTS idx_stm_student_id ON public.student_teacher_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_stm_teacher_id ON public.student_teacher_messages(teacher_id);
CREATE INDEX IF NOT EXISTS idx_stm_sender_id ON public.student_teacher_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_stm_created_at ON public.student_teacher_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_stm_is_read ON public.student_teacher_messages(is_read);

-- Enable RLS
ALTER TABLE public.student_teacher_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Students can view their own messages" ON public.student_teacher_messages;
CREATE POLICY "Students can view their own messages" ON public.student_teacher_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can view messages for their classes" ON public.student_teacher_messages;
CREATE POLICY "Teachers can view messages for their classes" ON public.student_teacher_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert messages" ON public.student_teacher_messages;
CREATE POLICY "Users can insert messages" ON public.student_teacher_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their received messages" ON public.student_teacher_messages;
CREATE POLICY "Users can update their received messages" ON public.student_teacher_messages
  FOR UPDATE USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
  );

-- Enable realtime (run this separately if it fails)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.student_teacher_messages;
    `)
    console.log('=' .repeat(60))
    console.log('\n✅ Copy the SQL above and run it in Supabase SQL Editor')
    console.log('🔗 Go to: https://supabase.com/dashboard/project/rhwgkinajlfuefmslbbb/sql/new\n')
  } else {
    console.log('✅ Migration completed successfully!\n')
  }
}

runMigration().catch(console.error)
