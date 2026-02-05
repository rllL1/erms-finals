'use client';

import { useEffect, useRef } from 'react';
import { Box, Typography, Paper, Avatar } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

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

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.secondary'
        }}
      >
        <Typography variant="body1">No messages yet. Start the conversation!</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      {messages.map((message) => {
        const isOwnMessage = message.sender_id === currentUserId;
        
        return (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: 1
            }}
          >
            {!isOwnMessage && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem'
                }}
              >
                {message.sender.full_name.charAt(0)}
              </Avatar>
            )}
            
            <Box
              sx={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary'
                  }}
                >
                  {isOwnMessage ? 'You' : message.sender.full_name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.disabled',
                    textTransform: 'capitalize'
                  }}
                >
                  ({message.sender.role})
                </Typography>
              </Box>
              
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                  color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  wordBreak: 'break-word'
                }}
              >
                <Typography variant="body2">{message.content}</Typography>
              </Paper>
              
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  mt: 0.5
                }}
              >
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </Typography>
            </Box>

            {isOwnMessage && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'secondary.main',
                  fontSize: '0.875rem'
                }}
              >
                {message.sender.full_name.charAt(0)}
              </Avatar>
            )}
          </Box>
        );
      })}
      <div ref={messagesEndRef} />
    </Box>
  );
}
