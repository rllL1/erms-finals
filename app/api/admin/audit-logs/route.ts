import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Parse query parameters for filtering
    const searchParams = new URL(request.url).searchParams
    const actionType = searchParams.get('action_type')
    const status = searchParams.get('status')
    const userRole = searchParams.get('user_role')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build the query
    let query = supabase
      .from('audit_logs')
      .select('*')

    // Apply filters
    if (actionType && actionType !== 'all') {
      query = query.eq('action_type', actionType)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (userRole && userRole !== 'all') {
      query = query.eq('user_role', userRole)
    }

    // Date range filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      // Add 1 day to include the entire "to" date
      const toDate = new Date(dateTo)
      toDate.setDate(toDate.getDate() + 1)
      query = query.lt('created_at', toDate.toISOString())
    }

    // Execute the query with ordering and limit
    const { data: auditLogs, error: auditError } = await query
      .order('created_at', { ascending: false })
      .limit(500)

    if (auditError) {
      console.error('Error fetching audit logs:', auditError)
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }

    // Filter by search term on client side only if provided
    let filteredLogs = auditLogs || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredLogs = filteredLogs.filter(
        (log: { user_name?: string; action?: string; resource_type?: string }) =>
          log.user_name?.toLowerCase().includes(searchLower) ||
          log.action?.toLowerCase().includes(searchLower) ||
          log.resource_type?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({ logs: filteredLogs })
  } catch (error) {
    console.error('Error in audit logs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      action,
      action_type,
      resource_type,
      resource_id,
      status,
      details,
      metadata,
    } = body

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    // Get user's IP address and user agent from headers
    const ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const user_agent = request.headers.get('user-agent') || 'unknown'

    // Insert audit log
    const { error: insertError } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: userProfile?.email || 'Unknown',
      user_role: userProfile?.role || 'unknown',
      action,
      action_type,
      resource_type,
      resource_id,
      status: status || 'success',
      details,
      metadata,
      ip_address,
      user_agent,
    })

    if (insertError) {
      console.error('Error creating audit log:', insertError)
      return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in audit logs POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
