'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MessageList from '@/app/components/messages/MessageList';
import MessageInput from '@/app/components/messages/MessageInput';
import { createClient } from '@/lib/supabase/client';
import ChatIcon from '@mui/icons-material/Chat';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    id: string;
    full_name: string;
    role: string;
  };
}

interface ClassWithTeacher {
  class_id: string;
  class_name: string;
  subject: string;
  teacher_id: string;
  teacher_user_id: string;
  teacher_name: string;
  unread_count: number;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

interface StudentMessagesClientProps {
  userId: string;
  studentId: string;
  studentName: string;
}

export default function StudentMessagesClient({ userId }: StudentMessagesClientProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [classes, setClasses] = useState<ClassWithTeacher[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassWithTeacher | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const supabase = createClient();

  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch('/api/student/messages/classes');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setClasses(data.classes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (classId: string, teacherId: string) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`/api/student/messages?classId=${classId}&teacherId=${teacherId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Mark messages as read
      await fetch('/api/student/messages/mark-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, teacherId })
      });
      
      // Refresh classes to update unread count
      fetchClasses();
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [fetchClasses]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClass) {
      fetchMessages(selectedClass.class_id, selectedClass.teacher_id);
    }
  }, [selectedClass, fetchMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('student-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_teacher_messages'
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            class_id: string;
            teacher_id: string;
            student_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };
          
          // If message is for the currently selected conversation
          if (selectedClass && 
              newMessage.class_id === selectedClass.class_id &&
              newMessage.teacher_id === selectedClass.teacher_id) {
            fetchMessages(selectedClass.class_id, selectedClass.teacher_id);
          }
          
          // Refresh classes to update last message and unread count
          fetchClasses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedClass, fetchMessages, fetchClasses]);

  const handleSelectClass = (classItem: ClassWithTeacher) => {
    setSelectedClass(classItem);
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedClass) return;

    try {
      const response = await fetch('/api/student/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass.class_id,
          teacherId: selectedClass.teacher_id,
          content
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, data.message]);
        fetchClasses(); // Update last message preview
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const ConversationListPanel = () => (
    <Box
      sx={{
        width: isMobile ? '100%' : 320,
        borderRight: isMobile ? 0 : 1,
        borderColor: 'divider',
        height: '100%',
        overflow: 'auto',
        display: isMobile && !showConversationList ? 'none' : 'block'
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold">
          Your Classes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Message your teachers
        </Typography>
      </Box>
      <List sx={{ p: 1 }}>
        {classes.map((classItem) => (
          <Box key={`${classItem.class_id}-${classItem.teacher_id}`}>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedClass?.class_id === classItem.class_id && 
                         selectedClass?.teacher_id === classItem.teacher_id}
                onClick={() => handleSelectClass(classItem)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    }
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SchoolIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>
                        {classItem.teacher_name}
                      </Typography>
                      {classItem.unread_count > 0 && (
                        <Chip
                          size="small"
                          label={classItem.unread_count}
                          color="error"
                          sx={{ height: 20, minWidth: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {classItem.class_name} • {classItem.subject}
                      </Typography>
                      {classItem.last_message && (
                        <Typography variant="caption" display="block" color="text.secondary" noWrap>
                          {classItem.last_message.content.substring(0, 30)}
                          {classItem.last_message.content.length > 30 ? '...' : ''}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          </Box>
        ))}
        {classes.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              You are not enrolled in any classes yet.
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );

  const ChatPanel = () => (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        ...(isMobile && showConversationList && { display: 'none' })
      }}
    >
      {selectedClass ? (
        <>
          {/* Chat Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.default'
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              {isMobile && (
                <IconButton onClick={handleBackToList} size="small">
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {selectedClass.teacher_name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {selectedClass.teacher_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedClass.class_name} • {selectedClass.subject}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {messagesLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : (
              <MessageList messages={messages} currentUserId={userId} />
            )}
          </Box>

          {/* Message Input */}
          <Box sx={{ p: 2 }}>
            <MessageInput onSendMessage={handleSendMessage} />
          </Box>
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary',
            gap: 2,
            p: 3
          }}
        >
          <ChatIcon sx={{ fontSize: 64, color: 'action.disabled' }} />
          <Typography variant="h6" align="center">
            Select a class to start messaging
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Choose a class from the list to message your teacher.
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Messages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Communicate with your teachers
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={2}
        sx={{
          height: 'calc(100vh - 250px)',
          display: 'flex',
          overflow: 'hidden'
        }}
      >
        <ConversationListPanel />
        <ChatPanel />
      </Paper>
    </Box>
  );
}
