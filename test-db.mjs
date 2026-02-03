import { createClient } from '@supabase/supabase-js'

// Hardcoded credentials from .env.local
const supabaseUrl = 'https://rhwgkinajlfuefmslbbb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJod2draW5hamxmdWVmbXNsYmJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMTQzNjEsImV4cCI6MjA4NTU5MDM2MX0.GDd2lHyeDRWSoVpW5jNmt-5ktB-TVOgU8FUIgbrUiUs'

console.log('\n🔍 Testing Supabase Connection...\n')
console.log(`📍 URL: ${supabaseUrl}`)
console.log(`🔑 Key: ${supabaseKey?.substring(0, 20)}...\n`)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('1️⃣ Testing basic connection...')
    
    // Test profiles table
    const { data: profiles, error: profileError, count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (profileError) {
      console.log('❌ Profiles table error:', profileError.message)
    } else {
      console.log(`✅ Profiles table: ${profileCount || 0} records`)
    }

    // Test teachers table
    const { data: teachers, error: teacherError, count: teacherCount } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true })
    
    if (teacherError) {
      console.log('❌ Teachers table error:', teacherError.message)
    } else {
      console.log(`✅ Teachers table: ${teacherCount || 0} records`)
    }

    // Test students table
    const { data: students, error: studentError, count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
    
    if (studentError) {
      console.log('❌ Students table error:', studentError.message)
    } else {
      console.log(`✅ Students table: ${studentCount || 0} records`)
    }

    // Test quizzes table
    const { data: quizzes, error: quizError, count: quizCount } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
    
    if (quizError) {
      console.log('❌ Quizzes table error:', quizError.message)
    } else {
      console.log(`✅ Quizzes table: ${quizCount || 0} records`)
    }

    // Test quiz_questions table
    const { data: quizQuestions, error: quizQuestionsError, count: quizQuestionsCount } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
    
    if (quizQuestionsError) {
      console.log('❌ Quiz questions table error:', quizQuestionsError.message)
    } else {
      console.log(`✅ Quiz questions table: ${quizQuestionsCount || 0} records`)
    }

    // Test assignments table
    const { data: assignments, error: assignmentError, count: assignmentCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
    
    if (assignmentError) {
      console.log('❌ Assignments table error:', assignmentError.message)
    } else {
      console.log(`✅ Assignments table: ${assignmentCount || 0} records`)
    }

    // Test exams table
    const { data: exams, error: examError, count: examCount } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
    
    if (examError) {
      console.log('❌ Exams table error:', examError.message)
    } else {
      console.log(`✅ Exams table: ${examCount || 0} records`)
    }

    // Test exam_questions table
    const { data: examQuestions, error: examQuestionsError, count: examQuestionsCount } = await supabase
      .from('exam_questions')
      .select('*', { count: 'exact', head: true })
    
    if (examQuestionsError) {
      console.log('❌ Exam questions table error:', examQuestionsError.message)
    } else {
      console.log(`✅ Exam questions table: ${examQuestionsCount || 0} records`)
    }

    console.log('\n2️⃣ Checking for quizzes with questions...')
    
    // Get a sample quiz with questions
    const { data: sampleQuizzes } = await supabase
      .from('quizzes')
      .select('id, title')
      .limit(5)
    
    if (sampleQuizzes && sampleQuizzes.length > 0) {
      console.log(`\nFound ${sampleQuizzes.length} quizzes:`)
      for (const quiz of sampleQuizzes) {
        const { count } = await supabase
          .from('quiz_questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', quiz.id)
        
        console.log(`  📝 "${quiz.title}": ${count || 0} questions`)
      }
    } else {
      console.log('No quizzes found in database')
    }

    console.log('\n✅ Database connection test completed!\n')
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message)
    process.exit(1)
  }
}

testConnection()
