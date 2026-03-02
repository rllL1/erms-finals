// Script to apply the class archive migration
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function applyMigration() {
  console.log('📦 Reading class archive migration file...')

  const migrationPath = join(__dirname, 'supabase', 'migrations', '011_add_class_archive.sql')
  const sql = readFileSync(migrationPath, 'utf8')

  console.log('🚀 Applying class archive migration...')

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`)

    try {
      // Use the Supabase Management API / pg endpoint
      const endpoints = ['/pg/sql', '/rest/v1/rpc/exec_sql', '/rest/v1/rpc/run_sql']
      let success = false

      for (const endpoint of endpoints) {
        try {
          const resp = await fetch(`${supabaseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ query: statement, sql: statement, sql_query: statement })
          })
          if (resp.ok) {
            console.log(`✅ Statement ${i + 1} succeeded via ${endpoint}`)
            successCount++
            success = true
            break
          }
        } catch {
          // try next endpoint
        }
      }

      if (!success) {
        console.log(`⚠️  Statement ${i + 1} may need manual execution`)
        errorCount++
      }
    } catch (err) {
      console.error(`❌ Error in statement ${i + 1}:`, err.message)
      errorCount++
    }
  }

  console.log(`\n✅ Migration attempted: ${successCount} succeeded, ${errorCount} errors`)

  // Always print the SQL for manual execution
  console.log('\n📝 If any statements failed, run the SQL manually in your Supabase SQL Editor:')
  
  // Extract project ref from URL
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
  console.log(`   Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`)
  
  console.log('\n--- Copy everything below this line ---\n')
  console.log(sql)
  console.log('\n--- End of SQL ---')
}

applyMigration().catch(console.error)
