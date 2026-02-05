'use client';

import {
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  Box,
  Divider
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  currentUserId: string;
  userRole: 'admin' | 'teacher';
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId,
  userRole
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          color: 'text.secondary'
        }}
      >
        <Typography variant="body2">
          No conversations yet
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {conversations.map((conversation, index) => {
        const otherUser = userRole === 'admin' ? conversation.teacher : conversation.admin;
        const isSelected = selectedConversationId === conversation.id;
        const hasUnread = conversation.unreadCount > 0;

        return (
          <Box key={conversation.id}>
            {index > 0 && <Divider />}
            <ListItem disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => onSelectConversation(conversation.id)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    '&:hover': {
                      bgcolor: 'action.selected'
                    }
                  }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={conversation.unreadCount}
                    color="error"
                    max={99}
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main'
                      }}
                    >
                      {otherUser.full_name.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      component="span"
                      sx={{
                        fontWeight: hasUnread ? 600 : 400,
                        display: 'block'
                      }}
                    >
                      {otherUser.full_name}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        component="span"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: hasUnread ? 500 : 400,
                          display: 'block'
                        }}
                      >
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </Typography>
                      {conversation.lastMessage && (
                        <Typography
                          variant="caption"
                          component="span"
                          color="text.disabled"
                          sx={{ display: 'block' }}
                        >
                          {formatDistanceToNow(new Date(conversation.lastMessage.created_at), {
                            addSuffix: true
                          })}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItemButton>
            </ListItem>
          </Box>
        );
      })}
    </List>
  );
}
