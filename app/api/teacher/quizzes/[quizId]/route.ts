import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete the quiz (questions will be cascade deleted if set up in DB)
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (error) {
      console.error('Error deleting quiz:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/teacher/quizzes/[quizId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
