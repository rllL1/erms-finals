/**
 * Utility functions for duplicate question detection.
 * Checks for identical and similar question text (case-insensitive, trimmed).
 */

/**
 * Normalize a question string for comparison:
 * - Lowercase
 * - Trim whitespace
 * - Collapse multiple spaces into one
 * - Remove trailing punctuation for comparison
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[?.!]+$/, '')
    .trim()
}

/**
 * Check if a question already exists in the list of existing questions.
 * Returns the index of the duplicate if found, or -1 if no duplicate.
 *
 * @param newQuestionText - The text of the question being added/changed
 * @param existingQuestions - Array of existing question texts
 * @param excludeIndex - Optional index to exclude (for editing an existing question)
 */
export function findDuplicateQuestion(
  newQuestionText: string,
  existingQuestions: string[],
  excludeIndex?: number
): number {
  if (!newQuestionText.trim()) return -1

  const normalizedNew = normalize(newQuestionText)
  if (!normalizedNew) return -1

  for (let i = 0; i < existingQuestions.length; i++) {
    if (i === excludeIndex) continue
    const normalizedExisting = normalize(existingQuestions[i])
    if (!normalizedExisting) continue

    // Exact match after normalization
    if (normalizedNew === normalizedExisting) {
      return i
    }
  }

  return -1
}

/**
 * Check if a question is a duplicate in a questions array.
 * Works with any object that has a `question` string field.
 */
export function isDuplicateQuestion<T extends { question: string }>(
  questionText: string,
  questions: T[],
  excludeIndex?: number
): boolean {
  const texts = questions.map((q) => q.question)
  return findDuplicateQuestion(questionText, texts, excludeIndex) !== -1
}
