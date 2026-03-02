import { createClient } from '@supabase/supabase-js'

const projectRef = 'rhwgkinajlfuefmslbbb'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJod2draW5hamxmdWVmbXNsYmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxNDM2MSwiZXhwIjoyMDg1NTkwMzYxfQ._X9JpnYed6gBPlNr_XSkQTMMbY9pmBsnB7uTDDZu-x0'

const supabase = createClient(`https://${projectRef}.supabase.co`, serviceRoleKey, {
  db: { schema: 'public' }
})

async function addArchiveColumns() {
  console.log('🔍 Step 1: Checking if group_classes table exists...')
  
  // Check current columns
  const { data: testData, error: testError } = await supabase
    .from('group_classes')
    .select('id')
    .limit(1)
  
  if (testError) {
    console.error('❌ Cannot access group_classes table:', testError.message)
    return
  }
  console.log('✅ group_classes table exists')

  // Check if archived_at column already exists by trying to select it
  console.log('\n🔍 Step 2: Checking if archived_at column exists...')
  const { data: colTest, error: colError } = await supabase
    .from('group_classes')
    .select('id, archived_at')
    .limit(1)
  
  if (!colError) {
    console.log('✅ archived_at column already exists! Migration not needed.')
    return
  }

  console.log('📝 archived_at column does not exist yet. Adding columns...')
  
  // Try to create an RPC function to execute SQL, then use it
  const url = `https://${projectRef}.supabase.co`
  
  // First, create the exec_sql function
  const createFuncSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT) 
    RETURNS VOID AS $$
    BEGIN
      EXECUTE sql_text;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  const alterStatements = [
    "ALTER TABLE group_classes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL",
    "ALTER TABLE group_classes ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMPTZ DEFAULT NULL",
    "CREATE INDEX IF NOT EXISTS idx_group_classes_archived ON group_classes (archived_at) WHERE archived_at IS NOT NULL",
    "CREATE INDEX IF NOT EXISTS idx_group_classes_auto_delete ON group_classes (auto_delete_at) WHERE auto_delete_at IS NOT NULL"
  ]

  // Method 1: Try all known SQL execution endpoints
  const endpoints = ['/pg/sql', '/rest/v1/rpc/pgexec', '/rest/v1/rpc/run_sql', '/rest/v1/rpc/execute_sql']
  
  for (const endpoint of endpoints) {
    for (const sql of alterStatements) {
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
          console.log(`✅ Success via ${endpoint}: ${sql.substring(0, 60)}...`)
        }
      } catch (e) {
        // skip
      }
    }
  }

  // Method 2: Try using supabase rpc with exec_sql
  for (const sql of alterStatements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_text: sql })
      if (!error) {
        console.log(`✅ Success via rpc: ${sql.substring(0, 60)}...`)
      }
    } catch (e) {
      // skip
    }
  }

  // Verify
  console.log('\n🔍 Step 3: Verifying columns were added...')
  const { error: verifyError } = await supabase
    .from('group_classes')
    .select('id, archived_at, auto_delete_at')
    .limit(1)
  
  if (!verifyError) {
    console.log('✅ Migration successful! Columns archived_at and auto_delete_at are now available.')
  } else {
    console.log('❌ Columns still not found. You must run the SQL manually.')
    console.log(`\n🔧 Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`)
    console.log('\n--- Copy and paste this SQL, then click Run ---\n')
    console.log(`ALTER TABLE group_classes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;`)
    console.log(`ALTER TABLE group_classes ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMPTZ DEFAULT NULL;`)
    console.log(`CREATE INDEX IF NOT EXISTS idx_group_classes_archived ON group_classes (archived_at) WHERE archived_at IS NOT NULL;`)
    console.log(`CREATE INDEX IF NOT EXISTS idx_group_classes_auto_delete ON group_classes (auto_delete_at) WHERE auto_delete_at IS NOT NULL;`)
    console.log('\n--- End of SQL ---')

    // Also try to reload schema cache
    console.log('\n🔄 After running the SQL, reload the schema cache:')
    console.log('Go to Supabase Dashboard → Settings → API → Click "Reload Schema Cache"')
  }
}

addArchiveColumns().catch(console.error)
