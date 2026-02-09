// Script to create the quiz-images storage bucket in Supabase
// Run with: node setup-storage-bucket.mjs

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  console.log('')
  console.log('You can find your Service Role Key in:')
  console.log('Supabase Dashboard → Project Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBucket() {
  console.log('🔧 Creating quiz-images bucket...')
  
  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message)
    return
  }
  
  const bucketExists = buckets?.some(b => b.name === 'quiz-images')
  
  if (bucketExists) {
    console.log('✅ quiz-images bucket already exists!')
    return
  }
  
  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('quiz-images', {
    public: true, // Make it public so images can be displayed
    fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
  })
  
  if (error) {
    console.error('❌ Error creating bucket:', error.message)
    return
  }
  
  console.log('✅ quiz-images bucket created successfully!')
  console.log('📁 Bucket details:', data)
}

createBucket()
