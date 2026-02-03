'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Plus, BookOpen, Clock, User, ArrowRight } from 'lucide-react'
import type { ClassStudent } from '@/lib/types'

interface Student {
  id: string
  student_name: string
  email: string
}

export default function StudentClassClient({ student }: { student: Student }) {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<ClassStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [openJoinDialog, setOpenJoinDialog] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/classes?studentId=${student.id}`, {
        cache: 'no-store',
      })
      const data = await response.json()
      
      if (response.ok) {
        setEnrollments(data.classes || [])
      } else {
        setError(data.error || 'Failed to fetch classes')
      }
    } catch (err) {
      setError('An error occurred while fetching classes')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClass = async () => {
    try {
      setError('')
      setSuccess('')

      if (!classCode.trim()) {
        setError('Please enter a class code')
        return
      }

      const response = await fetch('/api/student/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          class_code: classCode.trim().toUpperCase(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Successfully joined ${data.class.class_name}!`)
        setOpenJoinDialog(false)
        setClassCode('')
        fetchClasses()
      } else {
        setError(data.error || 'Failed to join class')
      }
    } catch (err) {
      setError('An error occurred while joining the class')
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <Box sx={{ maxWidth: '1536px', mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Classes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setOpenJoinDialog(true)}
          sx={{ bgcolor: 'rgb(16, 185, 129)', '&:hover': { bgcolor: 'rgb(5, 150, 105)' } }}
        >
          Join Class
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <BookOpen size={48} style={{ margin: '0 auto', color: '#9ca3af' }} />
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              No classes joined yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Join a class using a class code from your teacher
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={() => setOpenJoinDialog(true)}
              sx={{ bgcolor: 'rgb(16, 185, 129)', '&:hover': { bgcolor: 'rgb(5, 150, 105)' } }}
            >
              Join Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {enrollments.map((enrollment) => {
            const cls = enrollment.group_classes
            if (!cls) return null

            return (
              <Grid item xs={12} md={6} lg={4} key={enrollment.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s',
                    },
                  }}
                  onClick={() => router.push(`/student/class/${cls.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {cls.class_name}
                    </Typography>

                    <Chip
                      label={cls.subject}
                      size="small"
                      sx={{ mb: 2, bgcolor: 'rgb(16, 185, 129)', color: 'white' }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <User size={16} />
                      <Typography variant="body2" color="text.secondary">
                        {cls.teacher_name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Clock size={16} />
                      <Typography variant="body2" color="text.secondary">
                        {cls.class_start_time} - {cls.class_end_time}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Joined {new Date(enrollment.joined_at).toLocaleDateString()}
                      </Typography>
                      <ArrowRight size={20} color="#10b981" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Join Class Dialog */}
      <Dialog open={openJoinDialog} onClose={() => setOpenJoinDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Join a Class</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Class Code"
              fullWidth
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character class code"
              helperText="Ask your teacher for the class code"
              inputProps={{ maxLength: 8, style: { textTransform: 'uppercase' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJoinDialog(false)}>Cancel</Button>
          <Button
            onClick={handleJoinClass}
            variant="contained"
            sx={{ bgcolor: 'rgb(16, 185, 129)', '&:hover': { bgcolor: 'rgb(5, 150, 105)' } }}
          >
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
