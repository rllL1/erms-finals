<<<<<<< HEAD
import { NextResponse } from 'next/server'

interface GeneratedQuestion {
  id: string
  type: string
  question: string
  options?: string[]
  correctAnswer: string
}

// Use REST API directly for more control
async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite-001'
  ]
  
  let lastError: Error | null = null
  
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`)
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          console.log(`Success with model ${model}`)
          return text
        }
      }
      
      const errorData = await response.json().catch(() => ({}))
      console.log(`Model ${model} failed:`, response.status, JSON.stringify(errorData))
      
      // For rate limit, try next model
      if (response.status === 429) {
        lastError = new Error('Rate limit exceeded')
        continue
      }
      
      // For 404, try next model
      if (response.status === 404) {
        continue
      }
      
      // For other errors, throw
      throw new Error(errorData.error?.message || `API error: ${response.status}`)
      
    } catch (error) {
      console.error(`Model ${model} failed:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
  }
  
  throw lastError || new Error('All models failed. Please check your API key at https://aistudio.google.com/app/apikey')
}

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured', details: 'Please set GEMINI_API_KEY in your environment variables' },
=======
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
>>>>>>> 0cbd602de8bd693373398984b87275a6b57e1b3d
        { status: 500 }
      )
    }

<<<<<<< HEAD
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const prompt = formData.get('prompt') as string || ''
    const quizType = formData.get('quizType') as string || 'multiple-choice'
    const numQuestions = parseInt(formData.get('numQuestions') as string || '10')

    let fileContent = ''
    if (file) {
      fileContent = await file.text()
    }

    if (!prompt && !fileContent) {
      return NextResponse.json(
        { error: 'No content provided', details: 'Please provide a prompt or upload a file' },
        { status: 400 }
      )
    }

    // Build the prompt for Gemini
    let systemPrompt = `You are an educational quiz generator. Generate exactly ${numQuestions} quiz questions based on the provided content.

Quiz Type: ${quizType}

`

    if (quizType === 'multiple-choice') {
      systemPrompt += `Each question should have 4 options (A, B, C, D) with exactly one correct answer.

Return a valid JSON array with the following structure:
[
  {
    "id": "1",
    "type": "multiple-choice",
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The correct option text (must match one of the options exactly)"
  }
]`
    } else if (quizType === 'true-false') {
      systemPrompt += `Each question should be a statement that can be answered with True or False.

Return a valid JSON array with the following structure:
[
  {
    "id": "1",
    "type": "true-false",
    "question": "The statement to evaluate",
    "correctAnswer": "true" or "false"
  }
]`
    } else if (quizType === 'identification') {
      systemPrompt += `Each question should require a short text answer (1-3 words).

Return a valid JSON array with the following structure:
[
  {
    "id": "1",
    "type": "identification",
    "question": "The question text",
    "correctAnswer": "The short answer"
  }
]`
    } else if (quizType === 'essay') {
      systemPrompt += `Each question should be an open-ended essay question that requires a detailed written response. These will be manually graded by the teacher.

Return a valid JSON array with the following structure:
[
  {
    "id": "1",
    "type": "essay",
    "question": "The essay question text that requires a detailed response",
    "correctAnswer": ""
  }
]`
    }

    systemPrompt += `

IMPORTANT: 
- Return ONLY the JSON array, no markdown, no code blocks, no explanations.
- Make questions educational and clear.
- Ensure correct answers are accurate.
- Generate exactly ${numQuestions} questions.
- DO NOT generate duplicate or very similar questions. Each question must be unique.
- Vary the topics and difficulty levels within the content provided.
`

    let userContent = ''
    if (fileContent) {
      userContent = `Content from uploaded file:\n${fileContent}\n\n`
    }
    if (prompt) {
      userContent += `Additional instructions: ${prompt}`
    }

    const fullPrompt = systemPrompt + '\n\n' + userContent

    // Try to generate with available models
    let text: string
    try {
      text = await callGeminiAPI(fullPrompt, process.env.GEMINI_API_KEY || '')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check for rate limit errors
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        return NextResponse.json(
          { 
            error: 'API quota exceeded', 
            details: 'Gemini API rate limit reached. Please wait a minute and try again, or check your API quota at https://ai.google.dev/gemini-api/docs/rate-limits' 
          },
          { status: 429 }
        )
      }
      
      throw error
    }
=======
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    // Use gemini-2.0-flash - free Gemini model (current as of 2026)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
    })

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
>>>>>>> 0cbd602de8bd693373398984b87275a6b57e1b3d

    // Parse the JSON response
    let questions
    try {
<<<<<<< HEAD
      // Try to extract JSON from the response (in case there's markdown wrapping)
      let jsonText = text.trim()
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7)
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3)
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3)
      }
      jsonText = jsonText.trim()

      questions = JSON.parse(jsonText)

      // Validate and ensure proper structure
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array')
      }

      // Ensure each question has required fields and proper types
      let typedQuestions: GeneratedQuestion[] = questions.map((q: Record<string, unknown>, index: number) => ({
        id: String(q.id || index + 1),
        type: String(q.type || quizType),
        question: String(q.question || ''),
        options: Array.isArray(q.options) ? q.options.map(String) : undefined,
        correctAnswer: String(q.correctAnswer || ''),
      }))

      // Remove duplicate questions based on normalized question text
      const seenQuestions = new Set<string>()
      typedQuestions = typedQuestions.filter((q) => {
        // Normalize the question text (lowercase, trim, remove extra whitespace)
        const normalized = q.question.toLowerCase().trim().replace(/\s+/g, ' ')
        if (seenQuestions.has(normalized)) {
          return false // Skip duplicate
        }
        seenQuestions.add(normalized)
        return true
      })

      // Re-assign IDs after removing duplicates
      typedQuestions = typedQuestions.map((q, index) => ({
        ...q,
        id: String(index + 1),
      }))

      questions = typedQuestions

    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text)
      console.error('Parse error:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: 'The AI response was not valid JSON. Please try again.' },
=======
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
>>>>>>> 0cbd602de8bd693373398984b87275a6b57e1b3d
        { status: 500 }
      )
    }

<<<<<<< HEAD
    return NextResponse.json({ questions })

  } catch (error) {
    console.error('Error in generate-quiz API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate quiz', details: errorMessage },
=======
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
>>>>>>> 0cbd602de8bd693373398984b87275a6b57e1b3d
      { status: 500 }
    )
  }
}
