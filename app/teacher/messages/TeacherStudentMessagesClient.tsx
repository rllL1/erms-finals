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
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MessageList from '@/app/components/messages/MessageList';
import MessageInput from '@/app/components/messages/MessageInput';
import { createClient } from '@/lib/supabase/client';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
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

interface StudentInfo {
  student_id: string;
  student_user_id: string;
  student_name: string;
  unread_count: number;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

interface ClassWithStudents {
  class_id: string;
  class_name: string;
  subject: string;
  students: StudentInfo[];
}

interface SelectedConversation {
  class_id: string;
  class_name: string;
  subject: string;
  student_id: string;
  student_name: string;
}

export default function TeacherStudentMessagesClient({ userId }: { userId: string }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [classes, setClasses] = useState<ClassWithStudents[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [selectedConversation, setSelectedConversation] = useState<SelectedConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const supabase = createClient();

  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch('/api/teacher/student-messages/classes');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setClasses(data.classes || []);
      
      // Auto-expand all classes
      const expanded: Record<string, boolean> = {};
      (data.classes || []).forEach((c: ClassWithStudents) => {
        expanded[c.class_id] = true;
      });
      setExpandedClasses(expanded);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (classId: string, studentId: string) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`/api/teacher/student-messages?classId=${classId}&studentId=${studentId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Mark messages as read
      await fetch('/api/teacher/student-messages/mark-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, studentId })
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
    if (selectedConversation) {
      fetchMessages(selectedConversation.class_id, selectedConversation.student_id);
    }
  }, [selectedConversation, fetchMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('teacher-student-messages')
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
          if (selectedConversation && 
              newMessage.class_id === selectedConversation.class_id &&
              newMessage.student_id === selectedConversation.student_id) {
            fetchMessages(selectedConversation.class_id, selectedConversation.student_id);
          }
          
          // Refresh classes to update last message and unread count
          fetchClasses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedConversation, fetchMessages, fetchClasses]);

  const handleToggleClass = (classId: string) => {
    setExpandedClasses(prev => ({
      ...prev,
      [classId]: !prev[classId]
    }));
  };

  const handleSelectStudent = (classItem: ClassWithStudents, student: StudentInfo) => {
    setSelectedConversation({
      class_id: classItem.class_id,
      class_name: classItem.class_name,
      subject: classItem.subject,
      student_id: student.student_id,
      student_name: student.student_name
    });
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch('/api/teacher/student-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedConversation.class_id,
          studentId: selectedConversation.student_id,
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

  // Calculate total unread for potential future use
  // const totalUnread = classes.reduce((acc, c) => 
  //   acc + c.students.reduce((s, st) => s + st.unread_count, 0), 0
  // );

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
          Message your students
        </Typography>
      </Box>
      <List sx={{ p: 1 }}>
        {classes.map((classItem) => {
          const classUnread = classItem.students.reduce((acc, s) => acc + s.unread_count, 0);
          
          return (
            <Box key={classItem.class_id}>
              <ListItemButton 
                onClick={() => handleToggleClass(classItem.class_id)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SchoolIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" noWrap sx={{ maxWidth: 120 }}>
                        {classItem.class_name}
                      </Typography>
                      {classUnread > 0 && (
                        <Chip
                          size="small"
                          label={classUnread}
                          color="error"
                          sx={{ height: 20, minWidth: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={`${classItem.subject} • ${classItem.students.length} students`}
                />
                {expandedClasses[classItem.class_id] ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={expandedClasses[classItem.class_id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 2 }}>
                  {classItem.students.map((student) => (
                    <ListItem key={student.student_id} disablePadding>
                      <ListItemButton
                        selected={selectedConversation?.student_id === student.student_id && 
                                 selectedConversation?.class_id === classItem.class_id}
                        onClick={() => handleSelectStudent(classItem, student)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          pl: 2,
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            '&:hover': {
                              bgcolor: 'primary.light',
                            }
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                            <PersonIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                {student.student_name}
                              </Typography>
                              {student.unread_count > 0 && (
                                <Chip
                                  size="small"
                                  label={student.unread_count}
                                  color="error"
                                  sx={{ height: 18, minWidth: 18, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            student.last_message && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {student.last_message.content.substring(0, 25)}
                                {student.last_message.content.length > 25 ? '...' : ''}
                              </Typography>
                            )
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {classItem.students.length === 0 && (
                    <Box sx={{ p: 2, pl: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        No students enrolled
                      </Typography>
                    </Box>
                  )}
                </List>
              </Collapse>
            </Box>
          );
        })}
        {classes.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              You don&apos;t have any classes yet.
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
      {selectedConversation ? (
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
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {selectedConversation.student_name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {selectedConversation.student_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedConversation.class_name} • {selectedConversation.subject}
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
            Select a student to start messaging
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Choose a student from your classes to send a message.
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={2}
        sx={{
          height: 'calc(100vh - 200px)',
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
