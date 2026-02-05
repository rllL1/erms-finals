'use client';

import { useState } from 'react';
import { Box, TextField, IconButton, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        gap: 1,
        alignItems: 'flex-end'
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        disabled={disabled || sending}
        variant="outlined"
        size="small"
      />
      <IconButton
        type="submit"
        color="primary"
        disabled={!message.trim() || disabled || sending}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': {
            bgcolor: 'primary.dark'
          },
          '&.Mui-disabled': {
            bgcolor: 'action.disabledBackground'
          }
        }}
      >
        <SendIcon />
      </IconButton>
    </Paper>
  );
}
