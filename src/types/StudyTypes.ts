
export type QuestionOption = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  deckId: string;
};

export type Deck = {
  id: string;
  title: string;
  description?: string;
  parentId: string | null; // null for top-level decks
  isSubdeck: boolean;
  availableForPracticeTest?: boolean;
};

export type StudySession = {
  deckId: string;
  currentQuestionIndex: number;
  questions: Question[];
  incorrectQuestions: Question[];
  answeredQuestions: Record<string, string>; // questionId -> selectedOptionId
};

export type StudyState = {
  decks: Deck[];
  questions: Question[];
  questionBank: Question[]; // New property for question bank
  currentSession: StudySession | null;
  isLoading: boolean;
};

export type StudyAction =
  | { type: "SET_DECKS"; payload: Deck[] }
  | { type: "ADD_DECK"; payload: Deck }
  | { type: "UPDATE_DECK"; payload: Deck }
  | { type: "DELETE_DECK"; payload: string }
  | { type: "SET_QUESTIONS"; payload: Question[] }
  | { type: "ADD_QUESTION"; payload: Question }
  | { type: "UPDATE_QUESTION"; payload: Question }
  | { type: "DELETE_QUESTION"; payload: string }
  | { type: "START_SESSION"; payload: StudySession }
  | { type: "ANSWER_QUESTION"; payload: { questionId: string; selectedOptionId: string } }
  | { type: "NEXT_QUESTION" }
  | { type: "END_SESSION" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_QUESTION_BANK"; payload: Question[] }
  | { type: "ADD_TO_QUESTION_BANK"; payload: Question }
  | { type: "REMOVE_FROM_QUESTION_BANK"; payload: string }; // New action for removing from question bank

export type StudyStats = {
  total: number;
  correct: number;
  incorrect: number;
};

export type StudyContextType = {
  state: StudyState;
  dispatch: React.Dispatch<StudyAction>;
  getDeckById: (id: string) => Deck | undefined;
  getSubdecks: (parentId: string | null) => Deck[];
  getQuestionsForDeck: (deckId: string) => Question[];
  getAllQuestionsForDeck: (deckId: string) => Question[];
  getTotalQuestionsCount: (deckId: string) => number;
  getStudyStats: () => { total: number; correct: number; incorrect: number };
  startStudySession: (deckId: string) => void;
  answerQuestion: (questionId: string, selectedOptionId: string) => void;
  nextQuestion: () => void;
  endStudySession: () => void;
  exportDeck: (deckId: string) => void;
  importDeck: (deckData: string) => void;
  isQuestionInBank: (questionId: string) => boolean; // New helper function
};
