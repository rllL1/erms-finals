'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Helper function to log audit events
async function logAuditEvent(
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  actionType: 'login' | 'logout',
  status: 'success' | 'failure' | 'warning',
  details?: string
) {
  try {
    const supabaseAdmin = createAdminClient()
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      action_type: actionType,
      status,
      details,
      resource_type: 'authentication',
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  if (!email && !password) {
    return { error: 'All fields are required.' }
  }
  if (!email) {
    return { error: 'Email address is required.' }
  }
  if (!password) {
    return { error: 'Password is required.' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { error: 'Email format is invalid.' }
  }

  // Attempt to sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (authError) {
    // Try to find the user to log the failed attempt
    const supabaseAdmin = createAdminClient()
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('email', email.trim())
      .single()

    if (existingUser) {
      // Log failed login attempt for existing user
      await logAuditEvent(
        existingUser.id,
        existingUser.email,
        existingUser.role,
        `Failed login attempt for ${existingUser.email}`,
        'login',
        'failure',
        authError.message
      )
      // User exists but password is wrong
      return { error: 'Incorrect password.' }
    }

    if (authError.message.includes('Invalid login credentials')) {
      return { error: 'Account not found.' }
    }
    if (authError.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email address before logging in.' }
    }
    return { error: 'Invalid email or password.' }
  }

  if (!authData.user) {
    return { error: 'Account not found.' }
  }

  // Fetch user profile to get role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active, email')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { error: 'Role not assigned. Please contact your administrator.' }
  }

  if (!profile.is_active) {
    // Log disabled account login attempt
    await logAuditEvent(
      authData.user.id,
      profile.email || email,
      profile.role,
      `Login attempt for disabled account: ${profile.email || email}`,
      'login',
      'failure',
      'Account is disabled'
    )
    await supabase.auth.signOut()
    return { error: 'Your account is disabled. Please contact your administrator.' }
  }

  // Log successful login
  await logAuditEvent(
    authData.user.id,
    profile.email || email,
    profile.role,
    `User logged in: ${profile.email || email}`,
    'login',
    'success',
    `Role: ${profile.role}`
  )

  // Return success with role for client-side redirect (after showing success modal)
  const role = profile.role
  revalidatePath('/', 'layout')
  return { success: true, role }
}

export async function logout() {
  const supabase = await createClient()
  
  // Get user info before signing out for audit log
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      // Log the logout event
      await logAuditEvent(
        user.id,
        profile.email || user.email || 'Unknown',
        profile.role,
        `User logged out: ${profile.email || user.email}`,
        'logout',
        'success'
      )
    }
  }
  
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return {
    user,
    profile
  }
}
