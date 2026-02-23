// Script to apply the exam question types migration
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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('📦 Reading exam question types migration file...')

  const migrationPath = join(__dirname, 'supabase', 'migrations', '007_add_exam_question_types.sql')
  const sql = readFileSync(migrationPath, 'utf8')

  console.log('🚀 Applying exam question types migration...')

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
          console.log(`⚠️  Statement ${i + 1}/${statements.length} may need manual execution`)
          errorCount++
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

  if (errorCount > 0) {
    console.log('\n📝 If any statements failed, manually run the SQL in your Supabase SQL Editor:')
    console.log('1. Go to your Supabase Dashboard → SQL Editor')
    console.log('2. Paste the contents of: supabase/migrations/007_add_exam_question_types.sql')
    console.log('3. Click "Run" to execute\n')
  }

  // Print the SQL for manual execution
  console.log('\n--- SQL Migration (copy to Supabase SQL Editor if needed) ---\n')
  console.log(sql)
}

applyMigration().catch(console.error)
