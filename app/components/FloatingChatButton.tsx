'use client';

import { useState, useEffect } from 'react';
import { Fab, Badge, Tooltip, Zoom } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useRouter, usePathname } from 'next/navigation';

interface FloatingChatButtonProps {
  role: 'admin' | 'teacher';
}

export default function FloatingChatButton({ role }: FloatingChatButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
    <Zoom in={mounted} style={{ transitionDelay: '300ms' }}>
      <Tooltip 
        title={unreadCount > 0 ? `${unreadCount} new messages` : "Messages"} 
        placement="left"
        arrow
      >
        <Fab
          color="primary"
          aria-label="messages"
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          size="medium"
          sx={{
            position: 'fixed',
            bottom: { xs: 20, sm: 28 },
            right: { xs: 20, sm: 28 },
            zIndex: 1000,
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            boxShadow: isHovered 
              ? '0 8px 32px rgba(5, 150, 105, 0.4), 0 0 0 4px rgba(5, 150, 105, 0.15)'
              : '0 6px 24px rgba(5, 150, 105, 0.35)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
            '&:hover': {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            width: { xs: 52, sm: 60 },
            height: { xs: 52, sm: 60 },
            minHeight: 'unset',
            // Pulse animation when there are unread messages
            ...(unreadCount > 0 && {
              animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              '@keyframes pulse-ring': {
                '0%, 100%': {
                  boxShadow: '0 6px 24px rgba(5, 150, 105, 0.35), 0 0 0 0 rgba(5, 150, 105, 0.4)',
                },
                '50%': {
                  boxShadow: '0 6px 24px rgba(5, 150, 105, 0.35), 0 0 0 8px rgba(5, 150, 105, 0)',
                },
              },
            }),
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error" 
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontWeight: 700,
                fontSize: '0.7rem',
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
              }
            }}
          >
            <ChatIcon sx={{ fontSize: { xs: 24, sm: 26 } }} />
          </Badge>
        </Fab>
      </Tooltip>
    </Zoom>
  );
}
