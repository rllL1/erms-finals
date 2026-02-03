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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Plus, Users, Clock, Code, Trash2, Eye } from 'lucide-react'
import type { GroupClass } from '@/lib/types'

interface Teacher {
  id: string
  teacher_name: string
  email: string
}

export default function GroupClassClient({ teacher }: { teacher: Teacher }) {
  const router = useRouter()
  const [classes, setClasses] = useState<GroupClass[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const [formData, setFormData] = useState({
    class_name: '',
    subject: '',
    class_start_time: '',
    class_end_time: '',
  })

  useEffect(() => {
    setMounted(true)
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/classes?teacherId=${teacher.id}`, {
        cache: 'no-store',
      })
      const data = await response.json()
      
      if (response.ok) {
        setClasses(data.classes || [])
      } else {
        setError(data.error || 'Failed to fetch classes')
      }
    } catch (err) {
      setError('An error occurred while fetching classes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async () => {
    try {
      setError('')
      setSuccess('')

      if (!formData.class_name || !formData.subject || !formData.class_start_time || !formData.class_end_time) {
        setError('All fields are required')
        return
      }

      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacher.id,
          teacher_name: teacher.teacher_name,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Class created successfully!')
        setOpenDialog(false)
        setFormData({
          class_name: '',
          subject: '',
          class_start_time: '',
          class_end_time: '',
        })
        fetchClasses()
      } else {
        setError(data.error || 'Failed to create class')
      }
    } catch (err) {
      setError('An error occurred while creating the class')
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return

    try {
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Class deleted successfully')
        fetchClasses()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete class')
      }
    } catch (err) {
      setError('An error occurred while deleting the class')
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <Box sx={{ maxWidth: '1536px', mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Group Classes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: 'rgb(147, 51, 234)', '&:hover': { bgcolor: 'rgb(126, 34, 206)' } }}
        >
          Create Class
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
      ) : classes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No classes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first class to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={() => setOpenDialog(true)}
              sx={{ bgcolor: 'rgb(147, 51, 234)', '&:hover': { bgcolor: 'rgb(126, 34, 206)' } }}
            >
              Create Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {classes.map((cls) => (
            <Grid item xs={12} md={6} lg={4} key={cls.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {cls.class_name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/teacher/group-class/${cls.id}`)}
                        sx={{ color: 'rgb(147, 51, 234)' }}
                      >
                        <Eye size={20} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClass(cls.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <Trash2 size={20} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Chip
                    label={cls.subject}
                    size="small"
                    sx={{ mb: 2, bgcolor: 'rgb(147, 51, 234)', color: 'white' }}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Clock size={16} />
                    <Typography variant="body2" color="text.secondary">
                      {cls.class_start_time} - {cls.class_end_time}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Users size={16} />
                    <Typography variant="body2" color="text.secondary">
                      {cls.student_count || 0} student{cls.student_count !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Code size={16} />
                    <Typography variant="body2" fontWeight="bold">
                      {cls.class_code}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Class Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Class</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Class Name"
              fullWidth
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
            />
            <TextField
              label="Subject"
              fullWidth
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              helperText="Subject must be unique per teacher"
            />
            <TextField
              label="Start Time"
              type="time"
              fullWidth
              value={formData.class_start_time}
              onChange={(e) => setFormData({ ...formData, class_start_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Time"
              type="time"
              fullWidth
              value={formData.class_end_time}
              onChange={(e) => setFormData({ ...formData, class_end_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateClass}
            variant="contained"
            sx={{ bgcolor: 'rgb(147, 51, 234)', '&:hover': { bgcolor: 'rgb(126, 34, 206)' } }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
