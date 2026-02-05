'use client';

import { useState, useEffect } from 'react';
import { Fab, Badge, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useRouter, usePathname } from 'next/navigation';

interface FloatingChatButtonProps {
  role: 'admin' | 'teacher';
}

export default function FloatingChatButton({ role }: FloatingChatButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're already on the messages page
  const isOnMessagesPage = pathname?.includes('/messages');

  // Ensure component is mounted before fetching
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch unread message count
  useEffect(() => {
    if (!mounted) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/unread-count');
        if (!response.ok) return;
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return;
        
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [mounted]);

  const handleClick = () => {
    const messagesPath = role === 'admin' ? '/admin/messages' : '/teacher/messages';
    router.push(messagesPath);
  };

  // Don't show if already on messages page
  if (isOnMessagesPage) return null;

  return (
    <Tooltip title="Messages" placement="left">
      <Fab
        color="primary"
        aria-label="messages"
        onClick={handleClick}
        size="medium"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1000,
          bgcolor: '#16a34a',
          '&:hover': {
            bgcolor: '#15803d'
          },
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          minHeight: 'unset',
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <ChatIcon sx={{ fontSize: { xs: 22, sm: 24 } }} />
        </Badge>
      </Fab>
    </Tooltip>
  );
}
