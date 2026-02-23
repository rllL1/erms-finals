import { NextResponse } from 'next/server'

interface GeneratedQuestion {
  id: string
  type: string
  question: string
  options?: string[]
  correct_answer: string
  points: number
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
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const prompt = formData.get('prompt') as string || ''
    const examPeriod = formData.get('examPeriod') as string || 'prelim'
    const examTypesRaw = formData.get('examTypes') as string || '["multiple-choice"]'
    const questionCountsRaw = formData.get('questionCounts') as string || '{}'
    const numQuestions = parseInt(formData.get('numQuestions') as string || '10')

    let examTypes: string[] = []
    let questionCounts: Record<string, number> = {}

    try {
      examTypes = JSON.parse(examTypesRaw)
      questionCounts = JSON.parse(questionCountsRaw)
    } catch {
      examTypes = ['multiple-choice']
      questionCounts = { 'multiple-choice': numQuestions }
    }

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

    // Build type-specific instructions
    const typeInstructions: Record<string, string> = {
      'multiple-choice': `Multiple Choice questions: Each should have 4 options (A, B, C, D) with exactly one correct answer.
Format for each:
{
  "id": "ID",
  "type": "multiple-choice",
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "The correct option text (must match one of the options exactly)",
  "points": 1
}`,
      'true-false': `True/False questions: Each should be a statement that can be answered with True or False.
Format for each:
{
  "id": "ID",
  "type": "true-false",
  "question": "Statement to evaluate",
  "correct_answer": "true" or "false",
  "points": 1
}`,
      'identification': `Identification questions: Each should require a short text answer (1-3 words).
Format for each:
{
  "id": "ID",
  "type": "identification",
  "question": "Question text",
  "correct_answer": "Short answer",
  "points": 1
}`,
      'enumeration': `Enumeration questions: Each should ask for a list of items. The correct answer should be a comma-separated list.
Format for each:
{
  "id": "ID",
  "type": "enumeration",
  "question": "Question asking to list or enumerate items",
  "correct_answer": "item1, item2, item3",
  "points": 1
}`,
      'essay': `Essay questions: Each should be an open-ended question requiring a detailed written response. These will be manually graded.
Format for each:
{
  "id": "ID",
  "type": "essay",
  "question": "Essay question text",
  "correct_answer": "",
  "points": 5
}`,
      'math': `Math questions: Each should be a mathematical problem with a numerical or expression answer.
Format for each:
{
  "id": "ID",
  "type": "math",
  "question": "Math problem text",
  "correct_answer": "The numerical answer or expression",
  "points": 1
}`
    }

    // Build the prompt
    let systemPrompt = `You are an educational exam generator. Generate exam questions for a ${examPeriod} examination.

Generate questions for the following types and counts:
`

    for (const type of examTypes) {
      const count = questionCounts[type] || 5
      systemPrompt += `- ${type}: ${count} questions\n`
    }

    systemPrompt += `\nTotal questions: ${numQuestions}\n\n`
    systemPrompt += `Question format instructions for each type:\n\n`

    for (const type of examTypes) {
      if (typeInstructions[type]) {
        systemPrompt += typeInstructions[type] + '\n\n'
      }
    }

    systemPrompt += `
Return a valid JSON array containing ALL questions from all types combined. 

IMPORTANT:
- Return ONLY the JSON array, no markdown, no code blocks, no explanations.
- Make questions educational, clear, and appropriate for an exam.
- Ensure correct answers are accurate.
- Generate the exact number of questions specified for each type.
- DO NOT generate duplicate or very similar questions. Each question must be unique.
- Vary the topics and difficulty levels within the content provided.
- Number the IDs sequentially starting from "1".
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

    // Parse the JSON response
    let questions
    try {
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
        type: String(q.type || 'multiple-choice'),
        question: String(q.question || ''),
        options: Array.isArray(q.options) ? q.options.map(String) : undefined,
        correct_answer: String(q.correct_answer || q.correctAnswer || ''),
        points: Number(q.points) || (String(q.type) === 'essay' ? 5 : 1),
      }))

      // Remove duplicate questions based on normalized question text
      const seenQuestions = new Set<string>()
      typedQuestions = typedQuestions.filter((q) => {
        const normalized = q.question.toLowerCase().trim().replace(/\s+/g, ' ')
        if (seenQuestions.has(normalized)) {
          return false
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
        { status: 500 }
      )
    }

    return NextResponse.json({ questions })

  } catch (error) {
    console.error('Error in generate-exam API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate exam', details: errorMessage },
      { status: 500 }
    )
  }
}
