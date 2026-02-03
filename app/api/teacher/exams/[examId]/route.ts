import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const { examId } = params

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete the exam (questions will be cascade deleted if set up in DB)
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', examId)

    if (error) {
      console.error('Error deleting exam:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Exam deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/teacher/exams/[examId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
