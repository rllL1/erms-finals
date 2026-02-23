// Script to apply the feedback and approval migration
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
config({ path: join(__dirname, '.env.local') })

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
  
  const migrationPath = join(__dirname, 'supabase', 'migrations', '008_add_feedback_and_approval.sql')
  const sql = readFileSync(migrationPath, 'utf8')
  
  console.log('🚀 Applying feedback & approval migration...\n')
  
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    const preview = statement.substring(0, 60).replace(/\n/g, ' ')
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
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
          console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}...`)
          errorCount++
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`)
          successCount++
        }
      } else {
        console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ [${i + 1}/${statements.length}] Error:`, err.message)
      errorCount++
    }
  }
  
  console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} errors`)
  
  if (errorCount > 0) {
    console.log('\n📝 If errors occurred, manually run the migration in Supabase SQL Editor:')
    console.log('1. Go to your Supabase Dashboard → SQL Editor')
    console.log('2. Paste contents of: supabase/migrations/008_add_feedback_and_approval.sql')
    console.log('3. Click "Run"\n')
  }
}

applyMigration().catch(console.error)
