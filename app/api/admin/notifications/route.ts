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

    // Fetch recent audit logs (last 10)
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch recent exam creations (last 10)
    const { data: exams } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        type,
        created_at,
        teachers!inner (
          teacher_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Transform data for notifications
    const auditNotifications = (auditLogs || []).map((log) => ({
      id: log.id,
      type: 'audit',
      title: log.action,
      description: `${log.user_name} - ${log.resource_type || 'System'}`,
      status: log.status,
      action_type: log.action_type,
      created_at: log.created_at,
    }))

    const examNotifications = (exams || []).map((exam: any) => ({
      id: exam.id,
      type: 'exam',
      title: `New ${exam.type} created`,
      description: `${exam.title} by ${exam.teachers.teacher_name}`,
      exam_type: exam.type,
      created_at: exam.created_at,
    }))

    // Combine and sort by date
    const allNotifications = [...auditNotifications, ...examNotifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Get unread count (for demo, we'll use all as unread)
    const unreadCount = allNotifications.length

    return NextResponse.json({
      notifications: allNotifications.slice(0, 15),
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
