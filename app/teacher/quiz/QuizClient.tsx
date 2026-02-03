'use client'

import { useState } from 'react'
import { Tabs, Tab, Typography } from '@mui/material'
import QuizzesTab from './components/QuizzesTab'
import AssignmentTab from './components/AssignmentTab'
import ExamTab from './components/ExamTab'

interface Teacher {
  id: string
  teacher_name: string
  email: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`quiz-tabpanel-${index}`}
      aria-labelledby={`quiz-tab-${index}`}
      {...other}
    >
      {value === index && (
        <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function QuizClient({ teacher }: { teacher: Teacher }) {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <div style={{ maxWidth: '1536px', margin: '0 auto', marginTop: '32px', marginBottom: '32px', padding: '0 16px' }}>
      <Typography variant="h4" gutterBottom>
        Quiz Management
      </Typography>
      
      <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', marginBottom: '24px' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="quiz tabs">
          <Tab label="Quizzes" />
          <Tab label="Assignment" />
          <Tab label="Exam" />
        </Tabs>
      </div>

      <TabPanel value={tabValue} index={0}>
        <QuizzesTab teacherId={teacher.id} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <AssignmentTab teacherId={teacher.id} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <ExamTab teacherId={teacher.id} />
      </TabPanel>
    </div>
  )
}
