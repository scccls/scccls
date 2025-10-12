
import { StudyState, StudyAction } from "@/types/StudyTypes";
import { supabase } from "@/integrations/supabase/client";

// Reducer function
export function studyReducer(state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case "SET_DECKS":
      return { ...state, decks: action.payload };
    case "ADD_DECK":
      return { ...state, decks: [...state.decks, action.payload] };
    case "UPDATE_DECK":
      return {
        ...state,
        decks: state.decks.map((deck) =>
          deck.id === action.payload.id ? action.payload : deck
        ),
      };
    case "DELETE_DECK":
      return {
        ...state,
        decks: state.decks.filter((deck) => deck.id !== action.payload),
        questions: state.questions.filter((q) => q.deckId !== action.payload),
      };
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload };
    case "ADD_QUESTION":
      return { ...state, questions: [...state.questions, action.payload] };
    case "UPDATE_QUESTION":
      return {
        ...state,
        questions: state.questions.map((question) =>
          question.id === action.payload.id ? action.payload : question
        ),
      };
    case "DELETE_QUESTION":
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
      };
    case "START_SESSION":
      return { ...state, currentSession: action.payload };
    case "ANSWER_QUESTION":
      if (!state.currentSession) return state;
      
      const { questionId, selectedOptionId } = action.payload;
      const currentQuestion = state.questions.find(q => q.id === questionId);
      
      if (!currentQuestion) return state;
      
      const isCorrect = currentQuestion.correctOptionId === selectedOptionId;
      
      // Create a new array with current incorrectQuestions
      let incorrectQuestions = [...state.currentSession.incorrectQuestions];
      
      // If the answer is incorrect AND the question is not already in the incorrectQuestions array,
      // add it to the array
      if (!isCorrect) {
        const alreadyIncluded = incorrectQuestions.some(q => q.id === questionId);
        if (!alreadyIncluded) {
          incorrectQuestions.push(currentQuestion);
        }
        
        // Check if the question is already in the question bank
        const isInQuestionBank = state.questionBank.some(q => q.id === questionId);
        
        // If not in question bank, sync with Supabase and add to state
        if (!isInQuestionBank) {
          // Async operation - fire and forget
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase
                .from("question_bank")
                .upsert({
                  user_id: user.id,
                  question_id: questionId,
                })
                .then(({ error }) => {
                  if (error) console.error("Error adding to question bank:", error);
                });
            }
          });

          return {
            ...state,
            questionBank: [...state.questionBank, currentQuestion],
            currentSession: {
              ...state.currentSession,
              answeredQuestions: {
                ...state.currentSession.answeredQuestions,
                [questionId]: selectedOptionId,
              },
              incorrectQuestions,
            },
          };
        }
      }
      
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          answeredQuestions: {
            ...state.currentSession.answeredQuestions,
            [questionId]: selectedOptionId,
          },
          incorrectQuestions,
        },
      };
    case "NEXT_QUESTION":
      if (!state.currentSession) return state;
      
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          currentQuestionIndex: state.currentSession.currentQuestionIndex + 1,
        },
      };
    case "END_SESSION":
      return { ...state, currentSession: null };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_QUESTION_BANK":
      return { ...state, questionBank: action.payload };
    case "ADD_TO_QUESTION_BANK":
      // Check if question is already in bank
      const exists = state.questionBank.some(q => q.id === action.payload.id);
      if (exists) return state;
      
      // Sync with Supabase
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("question_bank")
            .upsert({
              user_id: user.id,
              question_id: action.payload.id,
            })
            .then(({ error }) => {
              if (error) console.error("Error adding to question bank:", error);
            });
        }
      });
      
      return { 
        ...state, 
        questionBank: [...state.questionBank, action.payload] 
      };
    case "REMOVE_FROM_QUESTION_BANK":
      return {
        ...state,
        questionBank: state.questionBank.filter(q => q.id !== action.payload)
      };
    default:
      return state;
  }
}
