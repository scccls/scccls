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
  // Split by lines but keep blank lines to detect question boundaries
  const allLines = text.split('\n').map(line => line.trim());
  
  // First non-empty line is the deck title
  const deckTitle = allLines.find(line => line.length > 0);
  if (!deckTitle) {
    throw new Error("Invalid format: Deck title is required");
  }

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
  let foundTitle = false;
  
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    
    // Skip the deck title
    if (!foundTitle && line === deckTitle) {
      foundTitle = true;
      continue;
    }
    
    // Blank line ends the current question
    if (line.length === 0) {
      if (currentQuestion && currentOptions.length > 0) {
        const question = createQuestion(currentQuestion, currentOptions, deck.id);
        questions.push(question);
        currentQuestion = null;
        currentOptions = [];
      }
      continue;
    }
    
    // Check if this line is an option (starts with * or -)
    const isMarkedOption = line.startsWith('*') || line.startsWith('-');
    
    if (isMarkedOption) {
      // This is a marked option
      if (!currentQuestion) {
        throw new Error(`Found an answer before any question at line ${i + 1}`);
      }
      
      const isCorrect = line.startsWith('*');
      const optionText = line.substring(1).trim();
      
      if (!optionText) {
        throw new Error(`Empty option text at line ${i + 1}`);
      }
      
      currentOptions.push({ text: optionText, isCorrect });
    } else if (currentQuestion) {
      // Already in a question, so this is an unmarked option
      currentOptions.push({ text: line, isCorrect: false });
    } else {
      // Start a new question
      currentQuestion = line;
      currentOptions = [];
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
