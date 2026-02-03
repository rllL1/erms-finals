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
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import { ArrowLeft, FileText, CheckCircle, Clock, Play } from 'lucide-react'
import type { GroupClass, ClassMaterial } from '@/lib/types'

interface Student {
  id: string
  student_name: string
  email: string
}

export default function StudentClassDetailClient({
  classId,
  student,
}: {
  classId: string
  student: Student
}) {
  const router = useRouter()
  const [classData, setClassData] = useState<GroupClass | null>(null)
  const [materials, setMaterials] = useState<ClassMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchClassData()
    fetchMaterials()
  }, [classId])

  const fetchClassData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/classes/${classId}`)
      const data = await response.json()
      
      if (response.ok) {
        setClassData(data.class)
      }
    } catch (err) {
      setError('Failed to fetch class details')
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch(
        `/api/student/classes/${classId}/materials?studentId=${student.id}`
      )
      const data = await response.json()
      
      if (response.ok) {
        console.log('Materials fetched:', data.materials)
        setMaterials(data.materials || [])
      }
    } catch (err) {
      console.error('Error fetching materials:', err)
    }
  }

  const handleStartMaterial = (material: ClassMaterial) => {
    console.log('Material clicked:', material)
    console.log('Has submission:', material.submission)
    
    if (material.submission && material.submission.id) {
      // Navigate to results page
      const materialType = material.material_type === 'quiz' ? 'quiz' : 'assignment'
      const resultUrl = `/student/class/${classId}/${materialType}/${material.id}/result/${material.submission.id}`
      console.log('Navigating to results:', resultUrl)
      router.push(resultUrl)
    } else {
      // Navigate to take quiz/assignment
      if (material.material_type === 'quiz') {
        router.push(`/student/class/${classId}/quiz/${material.id}`)
      } else {
        router.push(`/student/class/${classId}/assignment/${material.id}`)
      }
    }
  }

  const getStatusChip = (material: ClassMaterial) => {
    if (material.submission) {
      if (material.submission.is_graded) {
        return (
          <Chip
            icon={<CheckCircle size={16} />}
            label={`Score: ${material.submission.score}/${material.submission.max_score}`}
            color="success"
            size="small"
          />
        )
      }
      return <Chip label="Submitted" color="info" size="small" />
    }
    return <Chip label="Not Started" color="default" size="small" />
  }

  const isDueSoon = (dueDate: string | undefined) => {
    if (!dueDate) return false
    const now = new Date()
    const due = new Date(dueDate)
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilDue > 0 && hoursUntilDue <= 24
  }

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!classData) {
    return (
      <Box sx={{ maxWidth: '1536px', mx: 'auto', mt: 4, px: 2 }}>
        <Alert severity="error">Class not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: '1536px', mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      <Button
        startIcon={<ArrowLeft />}
        onClick={() => router.push('/student/class')}
        sx={{ mb: 2 }}
      >
        Back to My Classes
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {classData.class_name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={classData.subject} color="primary" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Teacher: {classData.teacher_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Time: {classData.class_start_time} - {classData.class_end_time}
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Quizzes & Assignments
      </Typography>

      {materials.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <FileText size={48} style={{ margin: '0 auto', color: '#9ca3af' }} />
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No materials available yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Time Limit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((material) => (
                <TableRow
                  key={material.id}
                  sx={{
                    bgcolor: isOverdue(material.due_date) && !material.submission
                      ? 'rgba(239, 68, 68, 0.05)'
                      : isDueSoon(material.due_date) && !material.submission
                      ? 'rgba(251, 191, 36, 0.05)'
                      : 'transparent',
                  }}
                >
                  <TableCell>
                    <Typography fontWeight="medium">{material.title}</Typography>
                    {material.description && (
                      <Typography variant="caption" color="text.secondary">
                        {material.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={material.material_type}
                      size="small"
                      color={material.material_type === 'quiz' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    {material.due_date ? (
                      <Box>
                        <Typography variant="body2">
                          {new Date(material.due_date).toLocaleString()}
                        </Typography>
                        {isOverdue(material.due_date) && !material.submission && (
                          <Chip label="Overdue" color="error" size="small" sx={{ mt: 0.5 }} />
                        )}
                        {isDueSoon(material.due_date) && !material.submission && (
                          <Chip
                            icon={<Clock size={12} />}
                            label="Due Soon"
                            color="warning"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No due date
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {material.time_limit ? `${material.time_limit} min` : 'No limit'}
                  </TableCell>
                  <TableCell>{getStatusChip(material)}</TableCell>
                  <TableCell align="right">
                    {!material.submission ? (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Play size={16} />}
                        onClick={() => handleStartMaterial(material)}
                        sx={{
                          bgcolor: 'rgb(16, 185, 129)',
                          '&:hover': { bgcolor: 'rgb(5, 150, 105)' },
                        }}
                      >
                        Start
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleStartMaterial(material)}
                      >
                        View Results
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
