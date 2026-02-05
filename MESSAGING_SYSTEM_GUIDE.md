# Real-Time Chat System Documentation

## Overview
A real-time messaging system enabling one-to-one communication between Admin and Teachers with instant message delivery, unread indicators, and chat history persistence.

## Features Implemented

### ✅ Core Features
- **One-to-One Communication**: Admin can chat with any Teacher individually
- **Real-Time Messaging**: Messages delivered instantly using Supabase Realtime
- **Unread Indicators**: Badge notifications showing unread message counts
- **Chat History**: All messages persist in database and remain visible after refresh/re-login
- **Rich Message Display**:
  - Sender name and role (Admin/Teacher)
  - Message content
  - Timestamp with relative time (e.g., "2 minutes ago")
- **Role-Based Access**:
  - Admins can select and chat with any teacher
  - Teachers can only chat with Admin
  - Proper authentication and authorization

### 🎨 User Interface
- **Admin Dashboard**:
  - List of all conversations with teachers
  - "New Chat" button to start conversation with any teacher
  - Unread message count badges
  - Scrollable message area
  - Message input with send button
  
- **Teacher Dashboard**:
  - Single conversation view with Admin
  - Automatic message loading
  - Real-time message updates
  - Simple, clean interface

- **Both Dashboards Include**:
  - Messages menu item in sidebar with unread badge
  - Avatar icons for users
  - Message bubbles styled differently for sender/receiver
  - Auto-scroll to latest message
  - Keyboard support (Enter to send)

## Setup Instructions

### 1. Run Database Migration

You need to run the migration file to create the necessary database tables:

**Option A: Using Supabase Dashboard (Recommended)**
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy the contents of `supabase/migrations/008_create_messaging_system.sql`
5. Paste and run the SQL

**Option B: Using Supabase CLI**
```bash
# If you have Supabase CLI installed
supabase db push
```

The migration creates:
- `conversations` table: Stores chat conversations between admin and teachers
- `messages` table: Stores individual messages
- Indexes for performance optimization
- Row Level Security (RLS) policies for access control
- Triggers for updating conversation timestamps

### 2. Enable Realtime in Supabase

1. Go to your Supabase Dashboard
2. Navigate to Database → Replication
3. Enable realtime for the following tables:
   - `messages`
   - `conversations`

### 3. Verify Installation

After running the migration, you can verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages');

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages');
```

## File Structure

```
app/
├── api/
│   └── messages/
│       ├── route.ts                    # Send/get messages
│       ├── conversations/
│       │   └── route.ts                # Get/create conversations
│       ├── mark-read/
│       │   └── route.ts                # Mark messages as read
│       ├── teachers/
│       │   └── route.ts                # Get teacher list (admin only)
│       └── unread-count/
│           └── route.ts                # Get unread message count
├── components/
│   └── messages/
│       ├── MessageList.tsx             # Display message thread
│       ├── MessageInput.tsx            # Input field for sending messages
│       └── ConversationList.tsx        # List of conversations (admin)
├── admin/
│   ├── components/
│   │   └── AdminSidebar.tsx           # Updated with Messages menu
│   └── messages/
│       ├── page.tsx                   # Admin messages page
│       └── AdminMessagesClient.tsx    # Admin chat interface
└── teacher/
    ├── components/
    │   └── TeacherSidebar.tsx         # Updated with Messages menu
    └── messages/
        ├── page.tsx                   # Teacher messages page
        └── TeacherMessagesClient.tsx  # Teacher chat interface

supabase/
└── migrations/
    └── 008_create_messaging_system.sql # Database schema
```

## Usage Guide

### For Admin Users

1. **Access Messages**:
   - Click on "Messages" in the sidebar
   - You'll see a list of existing conversations on the left

2. **Start a New Chat**:
   - Click the "New Chat" button
   - Select a teacher from the list
   - A new conversation will be created

3. **Send Messages**:
   - Select a conversation from the list
   - Type your message in the input field at the bottom
   - Press Enter or click the Send button

4. **View Unread Messages**:
   - Unread message count appears as a badge on the Messages menu item
   - Each conversation shows an unread count badge
   - Messages are automatically marked as read when you open a conversation

### For Teacher Users

1. **Access Messages**:
   - Click on "Messages" in the sidebar
   - You'll see your conversation with Admin (if one exists)

2. **Send Messages**:
   - Type your message in the input field at the bottom
   - Press Enter or click the Send button

3. **View Unread Messages**:
   - Unread count appears as a badge on the Messages menu item
   - Messages are automatically marked as read when you open the chat

## Technical Details

### Real-Time Implementation

The system uses Supabase Realtime to deliver messages instantly:

```typescript
// Example from AdminMessagesClient.tsx
const channel = supabase
  .channel('admin-messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    },
    (payload) => {
      // Handle new message
      fetchMessages(selectedConversation);
      fetchConversations();
    }
  )
  .subscribe();
```

### Security

- **Authentication**: All routes require authenticated users
- **Authorization**: Role-based access enforced at API and database level
- **RLS Policies**: PostgreSQL Row Level Security ensures users only see their own conversations
- **Data Validation**: Input sanitization and validation on all endpoints

### API Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/messages` | GET | Get messages for a conversation | Admin, Teacher |
| `/api/messages` | POST | Send a new message | Admin, Teacher |
| `/api/messages/conversations` | GET | Get all conversations | Admin, Teacher |
| `/api/messages/conversations` | POST | Create new conversation | Admin only |
| `/api/messages/mark-read` | PUT | Mark messages as read | Admin, Teacher |
| `/api/messages/teachers` | GET | Get list of teachers | Admin only |
| `/api/messages/unread-count` | GET | Get unread message count | Admin, Teacher |

### Database Schema

**conversations table**:
- `id` (UUID): Primary key
- `admin_id` (UUID): Reference to admin user
- `teacher_id` (UUID): Reference to teacher user
- `created_at` (timestamp): Creation time
- `updated_at` (timestamp): Last message time

**messages table**:
- `id` (UUID): Primary key
- `conversation_id` (UUID): Reference to conversation
- `sender_id` (UUID): User who sent the message
- `content` (text): Message content
- `is_read` (boolean): Read status
- `created_at` (timestamp): Send time
- `updated_at` (timestamp): Update time

## Troubleshooting

### Messages Not Appearing in Real-Time

1. Check if Realtime is enabled in Supabase Dashboard
2. Verify the subscription is active in browser console
3. Check for network errors in browser DevTools

### Unread Count Not Updating

- The count updates every 30 seconds automatically
- It also updates when you navigate to the Messages page
- Try refreshing the page

### Cannot Send Messages

1. Verify you're authenticated (check if logged in)
2. Check browser console for API errors
3. Ensure the conversation exists (admin must start it first)

### Database Connection Issues

1. Verify Supabase connection in `lib/supabase/client.ts`
2. Check if RLS policies are enabled
3. Verify user has correct role in database

## Future Enhancements (Optional)

The following features can be added in the future:

- ✨ **Typing Indicator**: Show when the other user is typing
- 🟢 **Online/Offline Status**: Display user presence
- 📎 **File Attachments**: Upload and share files/images
- 🔍 **Search Messages**: Search through message history
- 🗑️ **Delete Messages**: Allow users to delete their own messages
- ✏️ **Edit Messages**: Edit sent messages within a time window
- 📌 **Pin Messages**: Pin important messages to top
- 🔔 **Push Notifications**: Browser/mobile push notifications
- 👥 **Group Chat**: Enable multi-user conversations
- 💬 **Message Reactions**: Add emoji reactions to messages
- 📊 **Message Analytics**: Track message statistics

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify database migration was successful
3. Ensure Supabase Realtime is enabled
4. Check API endpoint responses in Network tab

## License

This messaging system is part of the ERMS application.
