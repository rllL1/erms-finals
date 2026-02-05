'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material'
import {
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  AlertCircle,
  Plus,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  GraduationCap,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface TeacherDashboardClientProps {
  teacher: any
  stats: {
    classesCount: number
    studentsCount: number
    quizzesCount: number
    assignmentsCount: number
    examsCount: number
    pendingSubmissions: number
  }
  recentSubmissions: any[]
  classData: any[]
  recentActivity: any[]
}

export default function TeacherDashboardClient({
  teacher,
  stats,
  recentSubmissions,
  classData,
  recentActivity,
}: TeacherDashboardClientProps) {
  const totalMaterials = stats.quizzesCount + stats.assignmentsCount + stats.examsCount
  const gradedPercentage = totalMaterials > 0 
    ? Math.round(((totalMaterials - stats.pendingSubmissions) / totalMaterials) * 100)
    : 100

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Welcome Section */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ py: 3, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              {teacher?.teacher_name?.charAt(0) || 'T'}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Welcome back, {teacher?.teacher_name || 'Teacher'}!
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Employee ID: {teacher?.employee_id || 'N/A'} • {teacher?.email}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
        gap: 2,
        mb: 3 
      }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(22, 163, 74, 0.1)', display: 'inline-flex', mb: 1 }}>
              <BookOpen size={24} color="#16a34a" />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="#16a34a">{stats.classesCount}</Typography>
            <Typography variant="body2" color="text.secondary">Classes</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', mb: 1 }}>
              <Users size={24} color="#2563eb" />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="#2563eb">{stats.studentsCount}</Typography>
            <Typography variant="body2" color="text.secondary">Students</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(124, 58, 237, 0.1)', display: 'inline-flex', mb: 1 }}>
              <ClipboardList size={24} color="#7c3aed" />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="#7c3aed">{stats.quizzesCount}</Typography>
            <Typography variant="body2" color="text.secondary">Quizzes</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(234, 88, 12, 0.1)', display: 'inline-flex', mb: 1 }}>
              <FileText size={24} color="#ea580c" />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="#ea580c">{stats.assignmentsCount}</Typography>
            <Typography variant="body2" color="text.secondary">Assignments</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(6, 182, 212, 0.1)', display: 'inline-flex', mb: 1 }}>
              <GraduationCap size={24} color="#0891b2" />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="#0891b2">{stats.examsCount}</Typography>
            <Typography variant="body2" color="text.secondary">Exams</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(220, 38, 38, 0.1)', display: 'inline-flex', mb: 1 }}>
              <AlertCircle size={24} color="#dc2626" />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="#dc2626">{stats.pendingSubmissions}</Typography>
            <Typography variant="body2" color="text.secondary">Pending</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3 
      }}>
        <Link href="/teacher/quiz/create-quiz" style={{ textDecoration: 'none' }}>
          <Card sx={{ 
            borderRadius: 2, 
            border: '2px solid #16a34a',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(22, 163, 74, 0.05)', transform: 'translateY(-2px)', boxShadow: 2 },
          }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(22, 163, 74, 0.1)' }}>
                <Plus size={20} color="#16a34a" />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight={600} color="#16a34a">Create Quiz</Typography>
                <Typography variant="caption" color="text.secondary">Add new quiz</Typography>
              </Box>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/quiz/create-assignment" style={{ textDecoration: 'none' }}>
          <Card sx={{ 
            borderRadius: 2, 
            border: '2px solid #2563eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.05)', transform: 'translateY(-2px)', boxShadow: 2 },
          }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(37, 99, 235, 0.1)' }}>
                <FileText size={20} color="#2563eb" />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight={600} color="#2563eb">Create Assignment</Typography>
                <Typography variant="caption" color="text.secondary">Add new task</Typography>
              </Box>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/group-class" style={{ textDecoration: 'none' }}>
          <Card sx={{ 
            borderRadius: 2, 
            border: '2px solid #7c3aed',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.05)', transform: 'translateY(-2px)', boxShadow: 2 },
          }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(124, 58, 237, 0.1)' }}>
                <BookOpen size={20} color="#7c3aed" />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight={600} color="#7c3aed">Manage Classes</Typography>
                <Typography variant="caption" color="text.secondary">View all classes</Typography>
              </Box>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/grades" style={{ textDecoration: 'none' }}>
          <Card sx={{ 
            borderRadius: 2, 
            border: '2px solid #ea580c',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(234, 88, 12, 0.05)', transform: 'translateY(-2px)', boxShadow: 2 },
          }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(234, 88, 12, 0.1)' }}>
                <BarChart3 size={20} color="#ea580c" />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight={600} color="#ea580c">View Grades</Typography>
                <Typography variant="caption" color="text.secondary">Student grades</Typography>
              </Box>
            </CardContent>
          </Card>
        </Link>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        gap: 3,
        mb: 3 
      }}>
        {/* Recent Activity */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(37, 99, 235, 0.1)' }}>
                  <Activity size={18} color="#2563eb" />
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">Recent Activity</Typography>
              </Box>
              <Link href="/teacher/quiz" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  View All <ArrowRight size={14} />
                </Typography>
              </Link>
            </Box>
            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
              {recentActivity.length > 0 ? (
                <Box sx={{ p: 1.5 }}>
                  {recentActivity.slice(0, 6).map((activity) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: 'grey.50',
                        '&:hover': { bgcolor: 'grey.100' },
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: activity.type === 'exam' ? 'rgba(22, 163, 74, 0.1)' : activity.type === 'quiz' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(234, 88, 12, 0.1)',
                        }}
                      >
                        {activity.type === 'exam' ? (
                          <GraduationCap size={16} color="#16a34a" />
                        ) : activity.type === 'quiz' ? (
                          <ClipboardList size={16} color="#2563eb" />
                        ) : (
                          <FileText size={16} color="#ea580c" />
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{activity.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(activity.created_at), 'MMM d, yyyy')}
                        </Typography>
                      </Box>
                      <Chip
                        label={activity.type}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          bgcolor: activity.type === 'exam' ? 'rgba(22, 163, 74, 0.1)' : activity.type === 'quiz' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(234, 88, 12, 0.1)',
                          color: activity.type === 'exam' ? '#16a34a' : activity.type === 'quiz' ? '#2563eb' : '#ea580c',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                  <Typography color="text.secondary">No recent activity</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* My Classes */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(22, 163, 74, 0.1)' }}>
                  <BookOpen size={18} color="#16a34a" />
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">My Classes</Typography>
              </Box>
              <Link href="/teacher/group-class" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  View All <ArrowRight size={14} />
                </Typography>
              </Link>
            </Box>
            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
              {classData.length > 0 ? (
                <Box sx={{ p: 1.5 }}>
                  {classData.slice(0, 5).map((cls) => {
                    const studentCount = cls.class_students?.length || cls.class_students?.[0]?.count || 0
                    return (
                      <Box
                        key={cls.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1.5,
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: 'grey.50',
                          '&:hover': { bgcolor: 'grey.100' },
                          '&:last-child': { mb: 0 },
                        }}
                      >
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(22, 163, 74, 0.1)' }}>
                          <BookOpen size={18} color="#16a34a" />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{cls.subject}</Typography>
                          <Typography variant="caption" color="text.secondary">{cls.class_name}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={600} color="#16a34a">{studentCount}</Typography>
                          <Typography variant="caption" color="text.secondary">students</Typography>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>No classes created yet</Typography>
                  <Link href="/teacher/group-class" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" color="primary">Create your first class</Typography>
                  </Link>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Grading Progress */}
      <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(124, 58, 237, 0.1)' }}>
                <CheckCircle size={18} color="#7c3aed" />
              </Box>
              <Typography variant="subtitle1" fontWeight="bold">Grading Progress</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {stats.pendingSubmissions} submissions pending
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={gradedPercentage} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 5 }
                }} 
              />
            </Box>
            <Typography variant="body2" fontWeight={600} color="#16a34a">{gradedPercentage}%</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(22, 163, 74, 0.1)' }}>
                <Clock size={18} color="#16a34a" />
              </Box>
              <Typography variant="subtitle1" fontWeight="bold">Recent Submissions</Typography>
            </Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Submitted</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, py: 1.5 }}>Score</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, py: 1.5 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.slice(0, 8).map((submission) => (
                    <TableRow key={submission.id} hover>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {submission.students?.student_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                          {submission.class_materials?.title || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={submission.class_materials?.material_type || 'N/A'}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            bgcolor: submission.class_materials?.material_type === 'quiz' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(234, 88, 12, 0.1)',
                            color: submission.class_materials?.material_type === 'quiz' ? '#2563eb' : '#ea580c',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(submission.submitted_at), 'MMM d, HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        {submission.is_graded ? (
                          <Typography variant="body2" fontWeight={600}>
                            {submission.score}/{submission.max_score}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Chip
                          label={submission.is_graded ? 'Graded' : 'Pending'}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: submission.is_graded ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: submission.is_graded ? '#16a34a' : '#f59e0b',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No submissions yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
