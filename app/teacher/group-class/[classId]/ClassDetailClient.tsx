'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material'
import { ArrowLeft, Users, FileText, Plus, Trash2, Code } from 'lucide-react'
import type { GroupClass, ClassStudent, ClassMaterial } from '@/lib/types'
import NotificationModal, { type ModalSeverity } from '@/app/components/NotificationModal'
import ConfirmationModal from '@/app/components/ConfirmationModal'

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
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ClassDetailClient({ classId, teacher }: { classId: string; teacher: Teacher }) {
  const router = useRouter()
  const [tabValue, setTabValue] = useState(0)
  const [classData, setClassData] = useState<GroupClass | null>(null)
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [materials, setMaterials] = useState<ClassMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: string; type: 'student' | 'material'; name: string }>({ open: false, id: '', type: 'student', name: '' })
  const [notification, setNotification] = useState<{ open: boolean; severity: ModalSeverity; message: string }>({ open: false, severity: 'success', message: '' })
  
  const [openMaterialDialog, setOpenMaterialDialog] = useState(false)
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  
  const [materialForm, setMaterialForm] = useState({
    material_type: 'quiz' as 'quiz' | 'assignment',
    quiz_id: '',
    title: '',
    description: '',
    time_limit: '',
    due_date: '',
  })

  useEffect(() => {
    setMounted(true)
    fetchClassDetails()
    fetchStudents()
    fetchMaterials()
    fetchQuizzesAndAssignments()
  }, [classId])

  const fetchClassDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/classes/${classId}`)
      const data = await response.json()
      
      if (response.ok) {
        setClassData(data.class)
      } else {
        console.error('Error response:', data)
        setError(data.error || 'Failed to fetch class details')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/students`)
      const data = await response.json()
      
      if (response.ok) {
        setStudents(data.students || [])
      }
    } catch (err) {
      console.error('Error fetching students:', err)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/materials`)
      const data = await response.json()
      
      if (response.ok) {
        setMaterials(data.materials || [])
      }
    } catch (err) {
      console.error('Error fetching materials:', err)
    }
  }

  const fetchQuizzesAndAssignments = async () => {
    try {
      const [quizResponse, assignmentResponse] = await Promise.all([
        fetch(`/api/teacher/quizzes?teacherId=${teacher.id}`),
        fetch(`/api/teacher/assignments?teacherId=${teacher.id}`),
      ])

      const quizData = await quizResponse.json()
      const assignmentData = await assignmentResponse.json()

      if (quizResponse.ok) setQuizzes(quizData.quizzes || [])
      if (assignmentResponse.ok) setAssignments(assignmentData.assignments || [])
    } catch (err) {
      console.error('Error fetching quizzes/assignments:', err)
    }
  }

  const handleAddMaterial = async () => {
    try {
      setError('')
      setSuccess('')

      const response = await fetch(`/api/teacher/classes/${classId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...materialForm,
          time_limit: materialForm.time_limit ? parseInt(materialForm.time_limit) : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Material added successfully!')
        setOpenMaterialDialog(false)
        setMaterialForm({
          material_type: 'quiz',
          quiz_id: '',
          title: '',
          description: '',
          time_limit: '',
          due_date: '',
        })
        fetchMaterials()
      } else {
        setError(data.error || 'Failed to add material')
      }
    } catch (err) {
      setError('An error occurred')
    }
  }

  const handleRemoveStudentClick = (studentId: string, studentName: string) => {
    setConfirmModal({ open: true, id: studentId, type: 'student', name: studentName })
  }

  const handleRemoveMaterialClick = (materialId: string, materialTitle: string) => {
    setConfirmModal({ open: true, id: materialId, type: 'material', name: materialTitle })
  }

  const handleConfirmRemove = async () => {
    const { id, type } = confirmModal
    setConfirmModal({ open: false, id: '', type: 'student', name: '' })

    if (type === 'student') {
      try {
        const response = await fetch(
          `/api/teacher/classes/${classId}/students?studentId=${id}`,
          { method: 'DELETE' }
        )

        if (response.ok) {
          setNotification({ open: true, severity: 'success', message: 'Student removed successfully!' })
          fetchStudents()
          fetchClassDetails()
        } else {
          const data = await response.json()
          setNotification({ open: true, severity: 'error', message: data.error || 'Failed to remove student' })
        }
      } catch (err) {
        setNotification({ open: true, severity: 'error', message: 'An error occurred' })
      }
    } else {
      try {
        const response = await fetch(
          `/api/teacher/classes/${classId}/materials?materialId=${id}`,
          { method: 'DELETE' }
        )

        if (response.ok) {
          setNotification({ open: true, severity: 'success', message: 'Material removed successfully!' })
          fetchMaterials()
        } else {
          const data = await response.json()
          setNotification({ open: true, severity: 'error', message: data.error || 'Failed to remove material' })
        }
      } catch (err) {
        setNotification({ open: true, severity: 'error', message: 'An error occurred' })
      }
    }
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
        onClick={() => router.push('/teacher/group-class')}
        sx={{ mb: 2 }}
      >
        Back to Classes
      </Button>

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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {classData.class_name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={classData.subject} color="primary" />
            <Chip
              icon={<Users size={16} />}
              label={`${students.length} Student${students.length !== 1 ? 's' : ''}`}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Time: {classData.class_start_time} - {classData.class_end_time}
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Code size={16} />
            <Typography variant="body2" fontWeight="bold">
              Class Code: {classData.class_code}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Students" />
          <Tab label="Materials" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Enrolled Students
            </Typography>
            {students.length === 0 ? (
              <Typography color="text.secondary">No students enrolled yet</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Joined Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>{enrollment.students?.student_name || 'N/A'}</TableCell>
                        <TableCell>{enrollment.students?.email || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(enrollment.joined_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/teacher/group-class/${classId}/student/${enrollment.student_id}/submissions`)}
                            sx={{ color: 'rgb(147, 51, 234)', mr: 1 }}
                            title="View Submissions"
                          >
                            <FileText size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveStudentClick(enrollment.student_id, enrollment.students?.student_name || 'this student')}
                            title="Remove Student"
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Class Materials</Typography>
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => setOpenMaterialDialog(true)}
            sx={{ bgcolor: 'rgb(147, 51, 234)', '&:hover': { bgcolor: 'rgb(126, 34, 206)' } }}
          >
            Add Material
          </Button>
        </Box>

        {materials.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No materials added yet</Typography>
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
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>{material.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={material.material_type}
                        size="small"
                        color={material.material_type === 'quiz' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      {material.due_date
                        ? new Date(material.due_date).toLocaleString()
                        : 'No due date'}
                    </TableCell>
                    <TableCell>
                      {material.time_limit ? `${material.time_limit} min` : 'No limit'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/teacher/group-class/${classId}/material/${material.id}`)}
                        sx={{ color: 'rgb(147, 51, 234)' }}
                      >
                        <FileText size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveMaterialClick(material.id, material.title)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, id: '', type: 'student', name: '' })}
        onConfirm={handleConfirmRemove}
        title={confirmModal.type === 'student' ? 'Remove Student' : 'Remove Material'}
        message={confirmModal.type === 'student'
          ? `Are you sure you want to remove "${confirmModal.name}" from this class?`
          : `Are you sure you want to remove "${confirmModal.name}" from this class?`}
        confirmLabel="Remove"
        variant="danger"
      />

      {/* Notification Modal */}
      <NotificationModal
        open={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
        severity={notification.severity}
        autoCloseMs={2000}
      />

      {/* Add Material Dialog */}
      <Dialog open={openMaterialDialog} onClose={() => setOpenMaterialDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Material to Class</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Material Type</InputLabel>
              <Select
                value={materialForm.material_type}
                label="Material Type"
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    material_type: e.target.value as 'quiz' | 'assignment',
                    quiz_id: '',
                  })
                }
              >
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="assignment">Assignment</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Select {materialForm.material_type === 'quiz' ? 'Quiz' : 'Assignment'}</InputLabel>
              <Select
                value={materialForm.quiz_id}
                label={`Select ${materialForm.material_type === 'quiz' ? 'Quiz' : 'Assignment'}`}
                onChange={(e) => {
                  const items = materialForm.material_type === 'quiz' ? quizzes : assignments
                  const item = items.find((i) => i.id === e.target.value)
                  setMaterialForm({
                    ...materialForm,
                    quiz_id: e.target.value,
                    title: item?.title || '',
                  })
                }}
              >
                {(materialForm.material_type === 'quiz' ? quizzes : assignments).map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {materialForm.material_type === 'assignment' && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Or
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => router.push('/teacher/quiz/create-assignment')}
                  sx={{ flexGrow: 1 }}
                >
                  Create New Assignment
                </Button>
              </Box>
            )}

            <TextField
              label="Title"
              fullWidth
              value={materialForm.title}
              onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={materialForm.description}
              onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
            />
            <TextField
              label="Time Limit (minutes)"
              type="number"
              fullWidth
              value={materialForm.time_limit}
              onChange={(e) => setMaterialForm({ ...materialForm, time_limit: e.target.value })}
            />
            <TextField
              label="Due Date"
              type="datetime-local"
              fullWidth
              value={materialForm.due_date}
              onChange={(e) => setMaterialForm({ ...materialForm, due_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMaterialDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddMaterial}
            variant="contained"
            sx={{ bgcolor: 'rgb(147, 51, 234)', '&:hover': { bgcolor: 'rgb(126, 34, 206)' } }}
          >
            Add Material
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
