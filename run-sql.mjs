import { createClient } from '@supabase/supabase-js'

const projectRef = 'rhwgkinajlfuefmslbbb'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJod2draW5hamxmdWVmbXNsYmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxNDM2MSwiZXhwIjoyMDg1NTkwMzYxfQ._X9JpnYed6gBPlNr_XSkQTMMbY9pmBsnB7uTDDZu-x0'

const sql1 = "ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_question_type_check"
const sql2 = "ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_question_type_check CHECK (question_type IN ('multiple-choice', 'true-false', 'identification', 'essay', 'enumeration', 'math'))"

const supabase = createClient(`https://${projectRef}.supabase.co`, serviceRoleKey, {
  db: { schema: 'public' }
})

async function tryAllMethods() {
  const url = `https://${projectRef}.supabase.co`
  
  // Method 1: Try different SQL execution endpoints
  const endpoints = [
    '/pg/sql',
    '/rest/v1/rpc/pgexec',
    '/rest/v1/rpc/run_sql',
    '/rest/v1/rpc/execute_sql',
  ]
  
  for (const endpoint of endpoints) {
    for (const sql of [sql1, sql2]) {
      try {
        const resp = await fetch(`${url}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          },
          body: JSON.stringify({ query: sql, sql: sql, sql_query: sql })
        })
        if (resp.ok) {
          console.log(`✅ Success via ${endpoint}`)
          const text = await resp.text()
          console.log('Response:', text.substring(0, 200))
          return
        }
      } catch (e) {
        // skip
      }
    }
  }

  // Method 2: Create SQL execution function first, then use it
  console.log('\n📝 Could not execute SQL remotely.')
  console.log('\n🔧 Please run the following SQL in your Supabase SQL Editor:')
  console.log('   Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
  console.log('\n--- Copy everything below this line ---\n')
  console.log(sql1 + ';\n')
  console.log(sql2 + ';\n')
  console.log('\n--- End of SQL ---')
}

tryAllMethods().catch(console.error)
