'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MessageList from '@/app/components/messages/MessageList';
import MessageInput from '@/app/components/messages/MessageInput';
import ConversationList from '@/app/components/messages/ConversationList';
import { createClient } from '@/lib/supabase/client';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

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

interface Conversation {
  id: string;
  admin: {
    id: string;
    full_name: string;
    email: string;
  };
  teacher: {
    id: string;
    full_name: string;
    email: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
  updated_at: string;
}

export default function AdminMessagesClient({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const supabase = createClient();

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations. Please ensure the database migration has been run.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Mark messages as read
      await fetch('/api/messages/mark-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      });
      
      // Refresh conversations to update unread count
      fetchConversations();
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [fetchConversations]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/messages/teachers');
      const data = await response.json();
      
      if (response.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
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
          const newMessage = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            is_read: boolean;
            created_at: string;
          };
          
          // If message is for the selected conversation, add it to messages
          if (selectedConversation && newMessage.conversation_id === selectedConversation) {
            fetchMessages(selectedConversation);
          }
          
          // Refresh conversations to update last message and unread count
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedConversation, fetchMessages, fetchConversations]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation,
          content
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, data.message]);
        fetchConversations(); // Update conversation list
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleStartNewChat = async (teacherId: string) => {
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowNewChatDialog(false);
        await fetchConversations();
        setSelectedConversation(data.conversation.id);
      } else {
        setError(data.error || 'Failed to create conversation');
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setError(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Messages
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            fetchTeachers();
            setShowNewChatDialog(true);
          }}
        >
          New Chat
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 250px)' }}>
        {/* Conversations List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={2}
            sx={{
              height: '100%',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold">
                Conversations
              </Typography>
            </Box>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation || undefined}
              onSelectConversation={handleSelectConversation}
              currentUserId={userId}
              userRole="admin"
            />
          </Paper>
        </Grid>

        {/* Messages Area */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={2}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {selectedConversation && selectedConvData ? (
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
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {selectedConvData.teacher.full_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {selectedConvData.teacher.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Teacher • {selectedConvData.teacher.email}
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
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary'
                }}
              >
                <Typography variant="h6">
                  Select a conversation or start a new chat
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* New Chat Dialog */}
      <Dialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Chat</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a teacher to start a conversation
          </Typography>
          <List>
            {teachers.map((teacher) => (
              <Box key={teacher.id}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleStartNewChat(teacher.id)}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {teacher.full_name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={teacher.full_name}
                      secondary={teacher.email}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
          {teachers.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              No teachers available
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
