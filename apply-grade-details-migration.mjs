// Script to apply the grade details migration (adds details JSONB + portfolio_score)
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying grade details migration...')

  const statements = [
    "ALTER TABLE grade_manual_scores ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'",
    "ALTER TABLE student_exam_scores ADD COLUMN IF NOT EXISTS portfolio_score NUMERIC(5,2) CHECK (portfolio_score >= 0 AND portfolio_score <= 100)"
  ]

  for (const sql of statements) {
    console.log(`  Running: ${sql.substring(0, 80)}...`)
    try {
      // Try direct SQL execution via Supabase Management API
      const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql_query: sql })
      })

      if (resp.ok) {
        console.log('  ✅ Success')
      } else {
        const text = await resp.text()
        // 42701 = column already exists, which is fine
        if (text.includes('42701') || text.includes('already exists')) {
          console.log('  ✅ Column already exists (OK)')
        } else {
          console.log(`  ⚠️ Response: ${text.substring(0, 200)}`)
        }
      }
    } catch (err) {
      console.error(`  ❌ Error:`, err.message)
    }
  }

  console.log('\n✅ Migration complete!')
  console.log('\nIf the above failed, run this SQL in Supabase SQL Editor:')
  console.log("  ALTER TABLE grade_manual_scores ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';")
  console.log("  ALTER TABLE student_exam_scores ADD COLUMN IF NOT EXISTS portfolio_score NUMERIC(5,2) CHECK (portfolio_score >= 0 AND portfolio_score <= 100);")
}

applyMigration().catch(console.error)
