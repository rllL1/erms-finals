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
  Button,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
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
  RefreshCw,
  Download,
  Calendar,
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [page, setPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const itemsPerPage = 15

  const fetchAuditLogs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      const response = await fetch('/api/admin/audit-logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        setError('Failed to fetch audit logs')
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
      setError('Failed to fetch audit logs. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchAuditLogs(true)
  }

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return

    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Type', 'Resource', 'Status', 'IP Address', 'Details']
    const csvData = filteredLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.user_name,
      log.user_role,
      log.action,
      log.action_type,
      log.resource_type || '',
      log.status,
      log.ip_address || '',
      log.details || ''
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
    link.click()
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setActionFilter('all')
    setStatusFilter('all')
    setRoleFilter('all')
    setDateFrom('')
    setDateTo('')
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

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((log) => new Date(log.created_at) >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((log) => new Date(log.created_at) <= toDate)
    }

    setFilteredLogs(filtered)
    setPage(1)
  }, [logs, searchQuery, actionFilter, statusFilter, roleFilter, dateFrom, dateTo])

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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Audit Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive tracking of all system activities
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            size={isMobile ? 'small' : 'medium'}
          >
            {isSmallMobile ? 'CSV' : 'Export CSV'}
          </Button>
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Clock className="w-5 h-5 text-blue-500" />
            <Typography variant="body2" color="text.secondary">
              Total
            </Typography>
          </Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold' }}>
            {logs.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <Typography variant="body2" color="text.secondary">
              Success
            </Typography>
          </Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold', color: 'success.main' }}>
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
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold', color: 'error.main' }}>
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
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold', color: 'warning.main' }}>
            {logs.filter((l) => l.status === 'warning').length}
          </Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Search and Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 250 } }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search className="w-5 h-5 text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              variant="text" 
              size="small" 
              onClick={handleClearFilters}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Clear Filters
            </Button>
          </Box>
          
          {/* Filter Dropdowns */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 130 } }}>
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
            <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 120 } }}>
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
            <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 120 } }}>
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

          {/* Date Range Filters */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar className="w-4 h-4 text-gray-400" />
              <Typography variant="body2" color="text.secondary">Date Range:</Typography>
            </Box>
            <TextField
              type="date"
              size="small"
              label="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 150 } }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 150 } }}
            />
            <Button 
              variant="text" 
              size="small" 
              onClick={handleClearFilters}
              sx={{ display: { xs: 'flex', sm: 'none' } }}
            >
              Clear Filters
            </Button>
          </Box>

          {/* Filter Result Count */}
          <Typography variant="caption" color="text.secondary">
            Showing {paginatedLogs.length} of {filteredLogs.length} logs
            {filteredLogs.length !== logs.length && ` (filtered from ${logs.length} total)`}
          </Typography>
        </Box>
      </Paper>

      {/* Audit Logs - Desktop Table View */}
      {!isMobile ? (
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
                  const ActionIcon = actionTypeConfig[log.action_type]?.icon || Settings
                  const StatusIcon = statusConfig[log.status]?.icon || AlertCircle
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
                            label={actionTypeConfig[log.action_type]?.label || log.action_type}
                            color={actionTypeConfig[log.action_type]?.color || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.resource_type || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={log.status}>
                            <StatusIcon
                              className={`w-5 h-5 text-${statusConfig[log.status]?.color || 'gray'}-500`}
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
      ) : (
        /* Mobile Card View */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : paginatedLogs.length === 0 ? (
            <Paper sx={{ py: 8, textAlign: 'center' }}>
              <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <Typography color="text.secondary">No audit logs found</Typography>
            </Paper>
          ) : (
            paginatedLogs.map((log) => {
              const ActionIcon = actionTypeConfig[log.action_type]?.icon || Settings
              const StatusIcon = statusConfig[log.status]?.icon || AlertCircle
              const isExpanded = expandedRow === log.id

              return (
                <Card key={log.id} variant="outlined">
                  <CardContent sx={{ pb: 1 }}>
                    {/* Header Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusIcon className={`w-5 h-5 text-${statusConfig[log.status]?.color || 'gray'}-500`} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {log.user_name}
                        </Typography>
                        <Chip label={log.user_role} size="small" />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                      </Typography>
                    </Box>

                    {/* Action */}
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      {log.action}
                    </Typography>

                    {/* Tags Row */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Chip
                        icon={<ActionIcon className="w-3 h-3" />}
                        label={actionTypeConfig[log.action_type]?.label || log.action_type}
                        color={actionTypeConfig[log.action_type]?.color || 'default'}
                        size="small"
                      />
                      {log.resource_type && (
                        <Chip label={log.resource_type} size="small" variant="outlined" />
                      )}
                    </Box>

                    {/* Expandable Details */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => toggleRow(log.id)}
                        endIcon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      >
                        {isExpanded ? 'Less' : 'More'}
                      </Button>
                    </Box>
                  </CardContent>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Divider />
                    <CardContent sx={{ bgcolor: 'grey.50' }}>
                      {log.details && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          {log.details}
                        </Alert>
                      )}
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            IP Address
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {log.ip_address || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            User Agent
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                            {log.user_agent || 'N/A'}
                          </Typography>
                        </Box>
                        {log.resource_id && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Resource ID
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {log.resource_id}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Collapse>
                </Card>
              )
            })
          )}
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
        </Box>
      )}
    </Box>
  )
}
