// Migration to add attachment_url and attachment_name columns to quizzes table
// Run with: node apply-assignment-files-migration.mjs

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔧 Adding attachment columns to quizzes table...')

  // Add attachment_url column
  const { error: err1 } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attachment_url TEXT;`
  }).single()

  if (err1) {
    // Try direct SQL via REST
    console.log('Trying alternative approach...')
    const { error: altErr1 } = await supabase.from('quizzes').select('attachment_url').limit(1)
    if (altErr1 && altErr1.message.includes('does not exist')) {
      console.log('Column attachment_url does not exist, will need manual migration.')
      console.log('')
      console.log('Please run this SQL in Supabase SQL Editor:')
      console.log('----')
      console.log('ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attachment_url TEXT;')
      console.log('ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attachment_name TEXT;')
      console.log('----')
    } else {
      console.log('✅ attachment_url column already exists or was created.')
    }
  } else {
    console.log('✅ attachment_url column added.')
  }

  // Add attachment_name column
  const { error: err2 } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attachment_name TEXT;`
  }).single()

  if (err2) {
    const { error: altErr2 } = await supabase.from('quizzes').select('attachment_name').limit(1)
    if (altErr2 && altErr2.message.includes('does not exist')) {
      console.log('Column attachment_name does not exist.')
    } else {
      console.log('✅ attachment_name column already exists or was created.')
    }
  } else {
    console.log('✅ attachment_name column added.')
  }

  console.log('')
  console.log('✅ Migration complete!')
  console.log('')
  console.log('If columns were not auto-created, run this SQL manually in Supabase Dashboard → SQL Editor:')
  console.log('  ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attachment_url TEXT;')
  console.log('  ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attachment_name TEXT;')
}

runMigration()
