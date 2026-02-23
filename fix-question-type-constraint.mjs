import { createClient } from '@supabase/supabase-js'

const s = createClient(
  'https://rhwgkinajlfuefmslbbb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJod2draW5hamxmdWVmbXNsYmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxNDM2MSwiZXhwIjoyMDg1NTkwMzYxfQ._X9JpnYed6gBPlNr_XSkQTMMbY9pmBsnB7uTDDZu-x0'
)

async function run() {
  // Try dropping and recreating the constraint via RPC
  const sql1 = 'ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_question_type_check'
  const sql2 = "ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_question_type_check CHECK (question_type IN ('multiple-choice', 'true-false', 'identification', 'essay', 'enumeration', 'math'))"

  console.log('Dropping old constraint...')
  const r1 = await s.rpc('exec_sql', { sql_query: sql1 })
  console.log('Drop result:', JSON.stringify(r1))

  console.log('Adding new constraint...')
  const r2 = await s.rpc('exec_sql', { sql_query: sql2 })
  console.log('Add result:', JSON.stringify(r2))

  // Also try via fetch to the Supabase SQL endpoint (PostgREST)
  if (r1.error || r2.error) {
    console.log('\nRPC failed, trying direct SQL endpoint...')
    
    const url = 'https://rhwgkinajlfuefmslbbb.supabase.co'
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJod2draW5hamxmdWVmbXNsYmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxNDM2MSwiZXhwIjoyMDg1NTkwMzYxfQ._X9JpnYed6gBPlNr_XSkQTMMbY9pmBsnB7uTDDZu-x0'

    // Try pg-meta endpoint
    for (const sql of [sql1, sql2]) {
      try {
        const resp = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': key,
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({ sql_query: sql })
        })
        const text = await resp.text()
        console.log(`SQL result (${resp.status}):`, text)
      } catch (err) {
        console.error('Fetch error:', err.message)
      }
    }

    console.log('\n⚠️  If the above failed, please run this SQL manually in your Supabase SQL Editor:')
    console.log('1. Go to https://supabase.com/dashboard → your project → SQL Editor')
    console.log('2. Run the following SQL:\n')
    console.log(sql1 + ';')
    console.log(sql2 + ';')
  } else {
    console.log('\n✅ Constraint updated successfully!')
  }
}

run().catch(console.error)
