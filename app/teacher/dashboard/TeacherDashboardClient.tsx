'use client'

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CardActionArea,
} from '@mui/material'
import {
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  Plus,
  BarChart3,
} from 'lucide-react'
import { ChartDataProvider } from '@mui/x-charts-premium/ChartDataProvider'
import { ChartsSurface } from '@mui/x-charts-premium/ChartsSurface'
import { BarPlot } from '@mui/x-charts-premium/BarChart'
import { ChartsLegend } from '@mui/x-charts-premium/ChartsLegend'
import { ChartsTooltip } from '@mui/x-charts-premium/ChartsTooltip'
import { ChartsXAxis } from '@mui/x-charts-premium/ChartsXAxis'
import { ChartsYAxis } from '@mui/x-charts-premium/ChartsYAxis'
import { ChartsAxisHighlight } from '@mui/x-charts-premium/ChartsAxisHighlight'

interface TeacherDashboardClientProps {
  teacher: any
  stats: {
    classesCount: number
    studentsCount: number
    quizzesCount: number
    assignmentsCount: number
    pendingSubmissions: number
  }
  recentSubmissions: any[]
  classData: any[]
}

export default function TeacherDashboardClient({
  teacher,
  stats,
  recentSubmissions,
  classData,
}: TeacherDashboardClientProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  // Prepare chart data
  const chartData = classData.map((cls) => ({
    class: cls.class_code,
    students: cls.class_students?.length || 0,
  }))

  const statCards = [
    {
      title: 'Total Classes',
      value: stats.classesCount,
      icon: BookOpen,
      color: '#16a34a',
      bgColor: 'rgba(22, 163, 74, 0.1)',
    },
    {
      title: 'Total Students',
      value: stats.studentsCount,
      icon: Users,
      color: '#2563eb',
      bgColor: 'rgba(37, 99, 235, 0.1)',
    },
    {
      title: 'Quizzes Created',
      value: stats.quizzesCount,
      icon: ClipboardList,
      color: '#7c3aed',
      bgColor: 'rgba(124, 58, 237, 0.1)',
    },
    {
      title: 'Assignments',
      value: stats.assignmentsCount,
      icon: FileText,
      color: '#ea580c',
      bgColor: 'rgba(234, 88, 12, 0.1)',
    },
    {
      title: 'Pending Grading',
      value: stats.pendingSubmissions,
      icon: AlertCircle,
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.1)',
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          color: 'white',
        }}
      >
        <CardContent sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              {teacher?.teacher_name?.charAt(0) || 'T'}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Welcome back, {teacher?.teacher_name || 'Teacher'}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Employee ID: {teacher?.employee_id || 'N/A'} • {teacher?.email}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
            <Card
              sx={{
                height: '100%',
                border: `3px solid ${stat.color}`,
                borderRadius: 2,
                overflow: 'visible',
              }}
            >
              <CardActionArea
                onClick={() => setSelectedCard(index)}
                data-active={selectedCard === index ? '' : undefined}
                sx={{
                  height: '100%',
                  bgcolor: 'white',
                  '&[data-active]': {
                    bgcolor: stat.bgColor,
                  },
                  '&:hover': {
                    bgcolor: stat.bgColor,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
                        {stat.title}
                      </Typography>
                      <Typography 
                        variant="h3" 
                        fontWeight="bold" 
                        sx={{ color: stat.color }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: stat.bgColor,
                        border: `2px solid ${stat.color}`,
                      }}
                    >
                      <stat.icon size={28} color={stat.color} />
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            component="a"
            href="/teacher/quiz/create-quiz"
            sx={{
              textDecoration: 'none',
              border: '2px solid #16a34a',
              height: '100%',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(22, 163, 74, 0.05)',
                transform: 'translateY(-2px)',
                boxShadow: 2,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(22, 163, 74, 0.1)',
                    border: '2px solid #16a34a',
                  }}
                >
                  <Plus size={24} color="#16a34a" />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600} color="#16a34a">
                    Create Quiz
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Add new quiz
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            component="a"
            href="/teacher/quiz/create-assignment"
            sx={{
              textDecoration: 'none',
              border: '2px solid #2563eb',
              height: '100%',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(37, 99, 235, 0.05)',
                transform: 'translateY(-2px)',
                boxShadow: 2,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(37, 99, 235, 0.1)',
                    border: '2px solid #2563eb',
                  }}
                >
                  <FileText size={24} color="#2563eb" />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600} color="#2563eb">
                    Create Assignment
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Add new assignment
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            component="a"
            href="/teacher/group-class"
            sx={{
              textDecoration: 'none',
              border: '2px solid #7c3aed',
              height: '100%',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(124, 58, 237, 0.05)',
                transform: 'translateY(-2px)',
                boxShadow: 2,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(124, 58, 237, 0.1)',
                    border: '2px solid #7c3aed',
                  }}
                >
                  <BookOpen size={24} color="#7c3aed" />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600} color="#7c3aed">
                    Manage Classes
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    View all classes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            component="a"
            href="/teacher/quiz"
            sx={{
              textDecoration: 'none',
              border: '2px solid #ea580c',
              height: '100%',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(234, 88, 12, 0.05)',
                transform: 'translateY(-2px)',
                boxShadow: 2,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(234, 88, 12, 0.1)',
                    border: '2px solid #ea580c',
                  }}
                >
                  <BarChart3 size={24} color="#ea580c" />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600} color="#ea580c">
                    View Materials
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    All quizzes & assignments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Class Enrollment Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(22, 163, 74, 0.1)',
                    border: '2px solid #16a34a',
                  }}
                >
                  <TrendingUp size={24} color="#16a34a" />
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  Student Enrollment by Class
                </Typography>
              </Box>
              {chartData.length > 0 ? (
                <Box sx={{ width: '100%', overflow: 'auto' }}>
                  <ChartDataProvider
                    height={400}
                    series={[
                      {
                        type: 'bar',
                        data: chartData.map((d) => d.students),
                        label: 'Students Enrolled',
                        color: '#16a34a',
                      },
                    ]}
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: chartData.map((d) => d.class),
                        label: 'Class Code',
                      },
                    ]}
                    yAxis={[{ label: 'Number of Students' }]}
                    margin={{ top: 40, bottom: 80, left: 70, right: 30 }}
                  >
                    <ChartsLegend />
                    <ChartsTooltip />
                    <ChartsSurface>
                      <ChartsXAxis />
                      <ChartsYAxis />
                      <BarPlot />
                      <ChartsAxisHighlight x="band" />
                    </ChartsSurface>
                  </ChartDataProvider>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    No class data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Submissions */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(37, 99, 235, 0.1)',
                    border: '2px solid #2563eb',
                  }}
                >
                  <FileText size={24} color="#2563eb" />
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  Recent Submissions
                </Typography>
              </Box>
              <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                        Student
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                        Material
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSubmissions.length > 0 ? (
                      recentSubmissions.map((submission) => (
                        <TableRow key={submission.id} hover>
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {submission.students?.student_name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {submission.class_materials?.group_classes?.class_name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography variant="body2" noWrap>
                              {submission.class_materials?.title || 'N/A'}
                            </Typography>
                            <Chip
                              label={submission.class_materials?.material_type || 'N/A'}
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor:
                                  submission.class_materials?.material_type === 'quiz'
                                    ? 'rgba(22, 163, 74, 0.1)'
                                    : 'rgba(37, 99, 235, 0.1)',
                                color:
                                  submission.class_materials?.material_type === 'quiz'
                                    ? '#16a34a'
                                    : '#2563eb',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Chip
                              label={submission.is_graded ? 'Graded' : 'Pending'}
                              size="small"
                              color={submission.is_graded ? 'success' : 'warning'}
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography color="text.secondary" py={4}>
                            No recent submissions
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
