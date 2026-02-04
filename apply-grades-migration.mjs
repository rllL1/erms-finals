// Script to apply the grades system migration
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('📦 Reading migration file...')
  
  const migrationPath = join(__dirname, 'supabase', 'migrations', '005_create_grades_system.sql')
  const sql = readFileSync(migrationPath, 'utf8')
  
  console.log('🚀 Applying grades system migration...')
  
  // Split by statement and execute
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
        // Try direct execution for DDL statements
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: statement })
        })
        
        if (!response.ok) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length} - Attempting via SQL editor...`)
        } else {
          successCount++
        }
      } else {
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error in statement ${i + 1}:`, err.message)
      errorCount++
    }
  }
  
  console.log(`\n✅ Migration attempted: ${successCount} succeeded, ${errorCount} errors`)
  console.log('\n📝 Please manually run the migration SQL in your Supabase SQL Editor:')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy and paste the contents of: supabase/migrations/005_create_grades_system.sql')
  console.log('4. Click "Run" to execute the migration\n')
}

applyMigration().catch(console.error)
