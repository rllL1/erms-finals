import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const BUCKET_NAME = 'quiz-images'

// Ensure the bucket exists, create if it doesn't
async function ensureBucketExists() {
  const adminClient = createAdminClient()
  
  // Check if bucket exists
  const { data: buckets } = await adminClient.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)
  
  if (!bucketExists) {
    // Create the bucket
    const { error } = await adminClient.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
    })
    
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bucket:', error)
      throw new Error(`Failed to create storage bucket: ${error.message}`)
    }
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    // questionId can be used later for tracking or logging
    const _questionId = formData.get('questionId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG and PNG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure bucket exists before uploading
    try {
      await ensureBucketExists()
    } catch (bucketError) {
      console.error('Bucket creation error:', bucketError)
      return NextResponse.json(
        { error: bucketError instanceof Error ? bucketError.message : 'Failed to initialize storage' },
        { status: 500 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const fileName = `question-images/${user.id}/${timestamp}-${randomString}.${extension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage using admin client for reliability
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json(
        { error: `Failed to upload image: ${error.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: data.path
    })

  } catch (error) {
    console.error('Error in upload-question-image API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle DELETE requests to remove uploaded images
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json(
        { error: 'No file name provided' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete from Supabase Storage using admin client
    const adminClient = createAdminClient()
    const { error } = await adminClient.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (error) {
      console.error('Storage delete error:', error)
      return NextResponse.json(
        { error: `Failed to delete image: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in delete question image API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
