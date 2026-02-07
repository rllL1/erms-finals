'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Badge } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import TeacherMessagesClient from './TeacherMessagesClient';
import TeacherStudentMessagesClient from './TeacherStudentMessagesClient';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`messages-tabpanel-${index}`}
      aria-labelledby={`messages-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function TeacherMessagesWrapper({ userId }: { userId: string }) {
  const [tabValue, setTabValue] = useState(0);
  const [studentUnreadCount, setStudentUnreadCount] = useState(0);

  useEffect(() => {
    const fetchStudentUnreadCount = async () => {
      try {
        const response = await fetch('/api/teacher/student-messages/unread-count');
        if (response.ok) {
          const data = await response.json();
          setStudentUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching student unread count:', error);
      }
    };

    fetchStudentUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStudentUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Messages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Communicate with admins and students
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="message tabs">
          <Tab 
            icon={<AdminPanelSettingsIcon />} 
            iconPosition="start" 
            label="Admin Messages" 
            id="messages-tab-0"
            aria-controls="messages-tabpanel-0"
          />
          <Tab 
            icon={
              <Badge badgeContent={studentUnreadCount} color="error" max={99}>
                <GroupIcon />
              </Badge>
            } 
            iconPosition="start" 
            label="Student Messages" 
            id="messages-tab-1"
            aria-controls="messages-tabpanel-1"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <TeacherMessagesClient userId={userId} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <TeacherStudentMessagesClient userId={userId} />
      </TabPanel>
    </Box>
  );
}
