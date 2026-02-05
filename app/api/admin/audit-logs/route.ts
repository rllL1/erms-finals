import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

    // Fetch audit logs from the database
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (auditError) {
      console.error('Error fetching audit logs:', auditError)
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }

    return NextResponse.json({ logs: auditLogs || [] })
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
