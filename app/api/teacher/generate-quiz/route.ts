import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const prompt = formData.get('prompt') as string
    const quizType = formData.get('quizType') as string
    const numQuestions = parseInt(formData.get('numQuestions') as string) || 10

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          details: 'GEMINI_API_KEY is not set in environment variables'
        },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    // Use gemini-pro which is the stable free model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    let contextText = ''

    // If a file was uploaded, extract its text content
    if (file) {
      const fileText = await file.text()
      contextText = `Based on the following content:\n\n${fileText}\n\n`
    }

    // Build the AI prompt based on quiz type
    let aiPrompt = contextText

    if (prompt) {
      aiPrompt += `Topic: ${prompt}\n\n`
    }

    switch (quizType) {
      case 'true-false':
        aiPrompt += `Generate ${numQuestions} true/false questions. 
        Return ONLY a valid JSON array with this exact structure:
        [
          {
            "id": "1",
            "type": "true-false",
            "question": "The question text here?",
            "correctAnswer": "True"
          }
        ]
        
        Rules:
        - correctAnswer must be exactly "True" or "False" (capitalize first letter)
        - id should be a string number starting from "1"
        - No markdown formatting, no code blocks, just pure JSON
        - Return only the JSON array, nothing else`
        break

      case 'identification':
        aiPrompt += `Generate ${numQuestions} identification/fill-in-the-blank questions.
        Return ONLY a valid JSON array with this exact structure:
        [
          {
            "id": "1",
            "type": "identification",
            "question": "What is _____?",
            "correctAnswer": "the answer"
          }
        ]
        
        Rules:
        - Keep correctAnswer concise (1-3 words ideally)
        - id should be a string number starting from "1"
        - No markdown formatting, no code blocks, just pure JSON
        - Return only the JSON array, nothing else`
        break

      case 'multiple-choice':
        aiPrompt += `Generate ${numQuestions} multiple choice questions with 4 options each.
        Return ONLY a valid JSON array with this exact structure:
        [
          {
            "id": "1",
            "type": "multiple-choice",
            "question": "What is the question?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A"
          }
        ]
        
        Rules:
        - Always provide exactly 4 options
        - correctAnswer must exactly match one of the options
        - id should be a string number starting from "1"
        - No markdown formatting, no code blocks, just pure JSON
        - Return only the JSON array, nothing else`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid quiz type', details: 'Quiz type must be true-false, identification, or multiple-choice' },
          { status: 400 }
        )
    }

    console.log('Sending prompt to Gemini:', aiPrompt.substring(0, 200) + '...')

    let result, response, text
    try {
      result = await model.generateContent(aiPrompt)
      response = await result.response
      text = response.text()
    } catch (aiError) {
      console.error('Gemini API Error:', aiError)
      return NextResponse.json(
        { 
          error: 'AI service error',
          details: aiError instanceof Error ? aiError.message : 'Failed to communicate with Gemini API. Please check your API key.'
        },
        { status: 500 }
      )
    }

    console.log('Gemini response length:', text.length)
    console.log('Gemini response preview:', text.substring(0, 200))

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, '')
    cleanedText = cleanedText.replace(/```\n?/g, '')
    cleanedText = cleanedText.trim()

    console.log('Cleaned response:', cleanedText)

    // Parse the JSON response
    let questions
    try {
      questions = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Response text:', cleanedText)
      return NextResponse.json(
        { 
          error: 'Invalid AI response',
          details: 'The AI returned an invalid response format. Please try again.',
          rawResponse: cleanedText.substring(0, 500) // Include first 500 chars for debugging
        },
        { status: 500 }
      )
    }

    // Validate the response structure
    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { 
          error: 'Invalid response format',
          details: 'Expected an array of questions'
        },
        { status: 500 }
      )
    }

    // Validate each question
    for (const q of questions) {
      if (!q.question || !q.correctAnswer || !q.type) {
        return NextResponse.json(
          { 
            error: 'Invalid question format',
            details: 'Each question must have question, correctAnswer, and type fields'
          },
          { status: 500 }
        )
      }

      if (q.type === 'multiple-choice' && (!q.options || q.options.length !== 4)) {
        return NextResponse.json(
          { 
            error: 'Invalid multiple choice question',
            details: 'Multiple choice questions must have exactly 4 options'
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ questions })

  } catch (error) {
    console.error('Error generating quiz:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to generate quiz',
          details: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate quiz',
        details: 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}
