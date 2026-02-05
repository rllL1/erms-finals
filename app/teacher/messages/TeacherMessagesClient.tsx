'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import MessageList from '@/app/components/messages/MessageList';
import MessageInput from '@/app/components/messages/MessageInput';
import { createClient } from '@/lib/supabase/client';
import ChatIcon from '@mui/icons-material/Chat';

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

interface Admin {
  id: string;
  full_name: string;
  email: string;
}

export default function TeacherMessagesClient({ userId }: { userId: string }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const supabase = createClient();

  const fetchConversation = useCallback(async () => {
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
      
      // Teachers only have one conversation with admin
      const conv = data.conversations && data.conversations.length > 0 
        ? data.conversations[0] 
        : null;
      setConversation(conv);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversation. Please ensure the database migration has been run.');
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
      
      // Refresh conversation to update unread count
      fetchConversation();
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [fetchConversation]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    if (conversation) {
      fetchMessages(conversation.id);
    }
  }, [conversation, fetchMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('teacher-messages')
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
          
          // If message is for this conversation, add it to messages
          if (conversation && newMessage.conversation_id === conversation.id) {
            fetchMessages(conversation.id);
          }
          
          // Refresh conversation to update last message and unread count
          fetchConversation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversation, fetchMessages, fetchConversation]);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/messages/admins');
      const data = await response.json();
      
      if (response.ok) {
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  const handleStartNewChat = async (adminId: string) => {
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowNewChatDialog(false);
        await fetchConversation();
      } else {
        setError(data.error || 'Failed to create conversation');
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!conversation) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          content
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, data.message]);
        fetchConversation(); // Update conversation
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Messages
        </Typography>
        {!conversation && (
          <Button
            variant="contained"
            startIcon={<ChatIcon />}
            onClick={() => {
              fetchAdmins();
              setShowNewChatDialog(true);
            }}
          >
            Start Chat with Admin
          </Button>
        )}
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
          flexDirection: 'column'
        }}
      >
        {conversation ? (
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
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {conversation.admin.full_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {conversation.admin.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Admin • {conversation.admin.email}
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
              No conversation with admin yet
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              Click the button above to start a conversation with an admin.
            </Typography>
            <Button
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => {
                fetchAdmins();
                setShowNewChatDialog(true);
              }}
              sx={{ mt: 2 }}
            >
              Start Chat with Admin
            </Button>
          </Box>
        )}
      </Paper>

      {/* New Chat Dialog */}
      <Dialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start Chat with Admin</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select an admin to start a conversation
          </Typography>
          <List>
            {admins.map((admin) => (
              <Box key={admin.id}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleStartNewChat(admin.id)}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        {admin.full_name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={admin.full_name}
                      secondary={admin.email}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
          {admins.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              No admins available
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
