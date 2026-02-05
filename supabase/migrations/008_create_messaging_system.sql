-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id, teacher_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_admin ON conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_teacher ON conversations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = FALSE;

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Admins can see all conversations they're part of
CREATE POLICY "Admins can view their conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND conversations.admin_id = auth.uid()
    )
  );

-- Teachers can see conversations they're part of
CREATE POLICY "Teachers can view their conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'teacher'
      AND conversations.teacher_id = auth.uid()
    )
  );

-- Admins can create conversations with teachers
CREATE POLICY "Admins can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND conversations.admin_id = auth.uid()
    )
  );

-- Teachers can create conversations with admins
CREATE POLICY "Teachers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'teacher'
      AND conversations.teacher_id = auth.uid()
    )
  );

-- Update conversations
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (
    admin_id = auth.uid() OR teacher_id = auth.uid()
  );

-- RLS Policies for messages
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id
      AND (conversations.admin_id = auth.uid() OR conversations.teacher_id = auth.uid())
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id
      AND (conversations.admin_id = auth.uid() OR conversations.teacher_id = auth.uid())
      AND messages.sender_id = auth.uid()
    )
  );

-- Users can update their own messages (for read status)
CREATE POLICY "Users can update messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id
      AND (conversations.admin_id = auth.uid() OR conversations.teacher_id = auth.uid())
    )
  );

-- Function to update conversation updated_at on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
