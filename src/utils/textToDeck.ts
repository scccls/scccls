import { Deck, Question, QuestionOption } from "@/types/StudyTypes";

export interface ParsedDeckData {
  deck: Deck;
  questions: Question[];
}

/**
 * Parse text-based question format into JSON deck structure
 * 
 * Supported format:
 * Deck Title
 * 
 * Question 1 text here
 * * Correct answer (marked with *)
 * Wrong answer 1
 * Wrong answer 2
 * Wrong answer 3
 * 
 * Question 2 text here
 * * Correct answer
 * Wrong answer
 */
export function parseTextToDeck(text: string): ParsedDeckData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length < 3) {
    throw new Error("Invalid format: Need at least a deck title, one question, and one answer");
  }

  // First line is the deck title
  const deckTitle = lines[0];
  
  const deck: Deck = {
    id: crypto.randomUUID(),
    title: deckTitle,
    description: undefined,
    parentId: null,
    isSubdeck: false,
  };

  const questions: Question[] = [];
  let currentQuestion: string | null = null;
  let currentOptions: { text: string; isCorrect: boolean }[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a question line (doesn't start with * or -)
    const isOption = line.startsWith('*') || line.startsWith('-');
    
    if (!isOption) {
      // Save previous question if exists
      if (currentQuestion && currentOptions.length > 0) {
        const question = createQuestion(currentQuestion, currentOptions, deck.id);
        questions.push(question);
      }
      
      // Start new question
      currentQuestion = line;
      currentOptions = [];
    } else {
      // This is an option
      if (!currentQuestion) {
        throw new Error(`Found an answer before any question at line ${i + 1}`);
      }
      
      const isCorrect = line.startsWith('*');
      const optionText = line.substring(1).trim(); // Remove the marker
      
      if (!optionText) {
        throw new Error(`Empty option text at line ${i + 1}`);
      }
      
      currentOptions.push({ text: optionText, isCorrect });
    }
  }
  
  // Don't forget the last question
  if (currentQuestion && currentOptions.length > 0) {
    const question = createQuestion(currentQuestion, currentOptions, deck.id);
    questions.push(question);
  }
  
  if (questions.length === 0) {
    throw new Error("No valid questions found in the text");
  }
  
  return { deck, questions };
}

function createQuestion(
  questionText: string, 
  optionData: { text: string; isCorrect: boolean }[], 
  deckId: string
): Question {
  if (optionData.length < 2) {
    throw new Error(`Question "${questionText}" must have at least 2 options`);
  }
  
  const correctOptions = optionData.filter(o => o.isCorrect);
  if (correctOptions.length === 0) {
    throw new Error(`Question "${questionText}" must have at least one correct answer marked with *`);
  }
  
  if (correctOptions.length > 1) {
    throw new Error(`Question "${questionText}" can only have one correct answer`);
  }
  
  const options: QuestionOption[] = optionData.map(opt => ({
    id: crypto.randomUUID(),
    text: opt.text,
  }));
  
  const correctOptionId = options[optionData.findIndex(o => o.isCorrect)].id;
  
  return {
    id: crypto.randomUUID(),
    text: questionText,
    options,
    correctOptionId,
    deckId,
  };
}

/**
 * Convert parsed deck data to JSON string for import
 */
export function parsedDeckToJSON(data: ParsedDeckData): string {
  return JSON.stringify({
    deck: data.deck,
    subdecks: [],
    questions: data.questions,
  }, null, 2);
}
