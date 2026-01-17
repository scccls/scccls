import { z } from 'zod';

// Maximum limits to prevent DoS
const MAX_QUESTIONS_PER_DECK = 1000;
const MAX_SUBDECKS = 100;
const MAX_OPTIONS_PER_QUESTION = 10;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_QUESTION_TEXT_LENGTH = 2000;
const MAX_OPTION_TEXT_LENGTH = 500;

// Schema for question option
const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Option text is required").max(MAX_OPTION_TEXT_LENGTH, `Option text must be less than ${MAX_OPTION_TEXT_LENGTH} characters`),
});

// Schema for a question in the import
const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Question text is required").max(MAX_QUESTION_TEXT_LENGTH, `Question text must be less than ${MAX_QUESTION_TEXT_LENGTH} characters`),
  options: z.array(optionSchema).min(2, "At least 2 options required").max(MAX_OPTIONS_PER_QUESTION, `Maximum ${MAX_OPTIONS_PER_QUESTION} options allowed`),
  correctOptionId: z.string().min(1, "Correct option ID is required"),
  deckId: z.string().optional(),
});

// Schema for a deck in the import
const deckSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Deck title is required").max(MAX_TITLE_LENGTH, `Title must be less than ${MAX_TITLE_LENGTH} characters`),
  description: z.string().max(MAX_DESCRIPTION_LENGTH, `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`).optional().nullable(),
  parentId: z.string().nullable().optional(),
  isSubdeck: z.boolean().optional(),
  availableForPracticeTest: z.boolean().optional(),
  isPastPaper: z.boolean().optional(),
});

// Schema for subdeck in the import
const subdeckSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(MAX_TITLE_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).optional().nullable(),
  parentId: z.string().nullable().optional(),
  isSubdeck: z.boolean().optional(),
  availableForPracticeTest: z.boolean().optional(),
  isPastPaper: z.boolean().optional(),
});

// Full deck import schema
export const deckImportSchema = z.object({
  deck: deckSchema,
  subdecks: z.array(subdeckSchema).max(MAX_SUBDECKS, `Maximum ${MAX_SUBDECKS} subdecks allowed`).optional(),
  questions: z.array(questionSchema).max(MAX_QUESTIONS_PER_DECK, `Maximum ${MAX_QUESTIONS_PER_DECK} questions allowed`),
});

export type ValidatedDeckImport = z.infer<typeof deckImportSchema>;

/**
 * Validates and parses deck import data
 * @throws Error if validation fails
 */
export function validateDeckImport(jsonString: string): ValidatedDeckImport {
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON format. Please check your file.");
  }
  
  // Validate against schema
  const result = deckImportSchema.safeParse(parsed);
  
  if (!result.success) {
    // Get first error for user-friendly message
    const firstError = result.error.errors[0];
    const path = firstError.path.join('.');
    throw new Error(`Validation error${path ? ` at ${path}` : ''}: ${firstError.message}`);
  }
  
  // Additional validation: ensure correctOptionId exists in options
  for (const question of result.data.questions) {
    const optionIds = question.options.map(o => o.id);
    if (!optionIds.includes(question.correctOptionId)) {
      throw new Error(`Question "${question.text.substring(0, 50)}..." has invalid correctOptionId`);
    }
  }
  
  return result.data;
}

// Schema for text import validation
export const textImportSchema = z.object({
  title: z.string().min(1).max(MAX_TITLE_LENGTH),
  questions: z.array(z.object({
    text: z.string().min(1).max(MAX_QUESTION_TEXT_LENGTH),
    options: z.array(z.object({
      text: z.string().min(1).max(MAX_OPTION_TEXT_LENGTH),
      isCorrect: z.boolean(),
    })).min(2).max(MAX_OPTIONS_PER_QUESTION),
  })).min(1).max(MAX_QUESTIONS_PER_DECK),
});

export type ValidatedTextImport = z.infer<typeof textImportSchema>;
