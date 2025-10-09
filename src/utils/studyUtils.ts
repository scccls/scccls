
import { Deck, Question } from "@/types/StudyTypes";

// Helper functions for study-related operations
export const getDeckQuestions = (
  questions: Question[],
  deckId: string
): Question[] => {
  return questions.filter((question) => question.deckId === deckId);
};

export const getSubdecks = (
  decks: Deck[],
  parentId: string | null
): Deck[] => {
  return decks.filter((deck) => deck.parentId === parentId);
};

export const getAllQuestionsForDeck = (
  questions: Question[],
  decks: Deck[],
  deckId: string
): Question[] => {
  const directQuestions = getDeckQuestions(questions, deckId);
  const subdecks = getSubdecks(decks, deckId);
  const subdeckQuestions = subdecks.flatMap((subdeck) =>
    getAllQuestionsForDeck(questions, decks, subdeck.id)
  );
  return [...directQuestions, ...subdeckQuestions];
};

export const createExportData = (
  deck: Deck,
  subdecks: Deck[],
  questions: Question[]
) => {
  const dataStr = JSON.stringify({ deck, subdecks, questions }, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  const exportFileDefaultName = `${deck.title.replace(/\s+/g, "_")}_deck.json`;
  
  return { dataUri, exportFileDefaultName };
};
