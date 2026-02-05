'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
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
    } catch (_err) {
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
    } catch (_err) {
      setError('An error occurred while joining the class')
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <Box sx={{ maxWidth: '1536px', mx: 'auto', mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        gap: 2,
        mb: 3 
      }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom sx={{ mb: 0 }}>
          My Classes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setOpenJoinDialog(true)}
          fullWidth={isMobile}
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
          <CardContent sx={{ textAlign: 'center', py: { xs: 4, sm: 8 } }}>
            <BookOpen size={isMobile ? 36 : 48} style={{ margin: '0 auto', color: '#9ca3af' }} />
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              No classes joined yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
              Join a class using a class code from your teacher
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => setOpenJoinDialog(true)}
              sx={{ bgcolor: 'rgb(16, 185, 129)', '&:hover': { bgcolor: 'rgb(5, 150, 105)' } }}
            >
              Join Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)' 
          }, 
          gap: { xs: 2, sm: 3 } 
        }}>
          {enrollments.map((enrollment) => {
            const cls = enrollment.group_classes
            if (!cls) return null

            return (
              <Card
                key={enrollment.id}
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
                  '@media (hover: none)': {
                    '&:active': {
                      transform: 'scale(0.98)',
                    }
                  }
                }}
                onClick={() => router.push(`/student/class/${cls.id}`)}
              >
                <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
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
            )
          })}
        </Box>
      )}

      {/* Join Class Dialog */}
      <Dialog 
        open={openJoinDialog} 
        onClose={() => setOpenJoinDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
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
        <DialogActions sx={{ p: { xs: 2, sm: 1 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
          <Button onClick={() => setOpenJoinDialog(false)} fullWidth={isMobile}>Cancel</Button>
          <Button
            onClick={handleJoinClass}
            variant="contained"
            fullWidth={isMobile}
            sx={{ bgcolor: 'rgb(16, 185, 129)', '&:hover': { bgcolor: 'rgb(5, 150, 105)' } }}
          >
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
