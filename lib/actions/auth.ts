'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Attempt to sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    if (authError.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password' }
    }
    if (authError.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email address' }
    }
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Account not found' }
  }

  // Fetch user profile to get role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { error: 'Role not assigned. Please contact administrator.' }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { error: 'Account is disabled. Please contact administrator.' }
  }

  // Redirect based on role
  const role = profile.role
  revalidatePath('/', 'layout')
  redirect(`/${role}/dashboard`)
}

export async function logout() {
  const supabase = await createClient()
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
