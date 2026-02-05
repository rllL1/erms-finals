'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Pagination,
  Alert,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material'
import {
  Search,
  Shield,
  UserPlus,
  FileEdit,
  Trash2,
  LogIn,
  LogOut,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  user_id: string
  user_name: string
  user_role: string
  action: string
  action_type: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'access' | 'system'
  resource_type?: string
  resource_id?: string
  ip_address?: string
  user_agent?: string
  status: 'success' | 'failure' | 'warning'
  details?: string
  metadata?: Record<string, unknown>
  created_at: string
}

type ChipColor = 'success' | 'info' | 'error' | 'primary' | 'default' | 'warning' | 'secondary'

const actionTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: ChipColor; label: string }> = {
  create: { icon: UserPlus, color: 'success', label: 'Create' },
  update: { icon: FileEdit, color: 'info', label: 'Update' },
  delete: { icon: Trash2, color: 'error', label: 'Delete' },
  login: { icon: LogIn, color: 'primary', label: 'Login' },
  logout: { icon: LogOut, color: 'default', label: 'Logout' },
  access: { icon: Shield, color: 'warning', label: 'Access' },
  system: { icon: Settings, color: 'secondary', label: 'System' },
}

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  success: { icon: CheckCircle, color: 'success' },
  failure: { icon: XCircle, color: 'error' },
  warning: { icon: AlertCircle, color: 'warning' },
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const itemsPerPage = 15

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/audit-logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = useCallback(() => {
    let filtered = [...logs]

    if (searchQuery) {
      filtered = filtered.filter(
        (log) =>
          log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.resource_type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action_type === actionFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((log) => log.status === statusFilter)
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((log) => log.user_role === roleFilter)
    }

    setFilteredLogs(filtered)
    setPage(1)
  }, [logs, searchQuery, actionFilter, statusFilter, roleFilter])

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [filterLogs])

  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Audit Logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive tracking of all system activities and user actions
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Clock className="w-5 h-5 text-blue-500" />
            <Typography variant="body2" color="text.secondary">
              Total Activities
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {logs.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <Typography variant="body2" color="text.secondary">
              Successful
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
            {logs.filter((l) => l.status === 'success').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <XCircle className="w-5 h-5 text-red-500" />
            <Typography variant="body2" color="text.secondary">
              Failed
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
            {logs.filter((l) => l.status === 'failure').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <Typography variant="body2" color="text.secondary">
              Warnings
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
            {logs.filter((l) => l.status === 'warning').length}
          </Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 250 }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="w-5 h-5 text-gray-400" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Action Type</InputLabel>
            <Select
              value={actionFilter}
              label="Action Type"
              onChange={(e: SelectChangeEvent) => setActionFilter(e.target.value)}
            >
              <MenuItem value="all">All Actions</MenuItem>
              <MenuItem value="create">Create</MenuItem>
              <MenuItem value="update">Update</MenuItem>
              <MenuItem value="delete">Delete</MenuItem>
              <MenuItem value="login">Login</MenuItem>
              <MenuItem value="logout">Logout</MenuItem>
              <MenuItem value="access">Access</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failure">Failure</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e: SelectChangeEvent) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="student">Student</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Audit Logs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ width: 50 }}></TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Resource</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <Typography color="text.secondary">No audit logs found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => {
                const ActionIcon = actionTypeConfig[log.action_type].icon
                const StatusIcon = statusConfig[log.status].icon
                const isExpanded = expandedRow === log.id

                return (
                  <React.Fragment key={log.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggleRow(log.id)}>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {log.user_name}
                          </Typography>
                          <Chip label={log.user_role} size="small" sx={{ mt: 0.5 }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.action}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<ActionIcon className="w-3 h-3" />}
                          label={actionTypeConfig[log.action_type].label}
                          color={actionTypeConfig[log.action_type].color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.resource_type || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={log.status}>
                          <StatusIcon
                            className={`w-5 h-5 text-${statusConfig[log.status].color}-500`}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {log.ip_address || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0, border: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                              Details
                            </Typography>
                            {log.details && (
                              <Alert severity="info" sx={{ mb: 2 }}>
                                {log.details}
                              </Alert>
                            )}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  User Agent
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                                >
                                  {log.user_agent || 'N/A'}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Resource ID
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                                >
                                  {log.resource_id || 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Metadata
                                </Typography>
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: 1.5,
                                    mt: 1,
                                    bgcolor: 'background.paper',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    overflow: 'auto',
                                  }}
                                >
                                  <pre style={{ margin: 0 }}>
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </Paper>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
        </Box>
      )}
    </Box>
  )
}
