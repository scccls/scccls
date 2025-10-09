import React, { createContext, useContext, useEffect, useReducer } from "react";
import { Deck, Question, StudySession, StudyState, StudyContextType } from "@/types/StudyTypes";
import { toast } from "@/components/ui/use-toast";
import { studyReducer } from "@/reducers/studyReducer";
import { 
  getDeckQuestions, 
  getSubdecks as getSubdecksUtil, 
  getAllQuestionsForDeck as getAllQuestionsUtil,
  createExportData
} from "@/utils/studyUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { getQuestionAttempts, sortQuestionsByScore } from "@/utils/questionScoring";

const initialState: StudyState = {
  decks: [],
  questions: [],
  questionBank: [],
  currentSession: null,
  isLoading: true,
};

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(studyReducer, initialState);
  const { user } = useAuth();

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (!user) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    const loadData = async () => {
      try {
        // Load decks
        const { data: decksData, error: decksError } = await supabase
          .from("decks")
          .select("*")
          .order("created_at", { ascending: true });

        if (decksError) throw decksError;

        const decks: Deck[] = (decksData || []).map(d => ({
          id: d.id,
          title: d.title,
          description: d.description || undefined,
          parentId: d.parent_id,
          isSubdeck: d.is_subdeck,
          availableForPracticeTest: d.available_for_practice_test || false
        }));

        dispatch({ type: "SET_DECKS", payload: decks });

        // Load questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .order("created_at", { ascending: true });

        if (questionsError) throw questionsError;

        const questions: Question[] = (questionsData || []).map(q => ({
          id: q.id,
          text: q.text,
          options: q.options as any,
          correctOptionId: q.correct_option_id,
          deckId: q.deck_id
        }));

        dispatch({ type: "SET_QUESTIONS", payload: questions });

        // Load question bank
        const { data: bankData, error: bankError } = await supabase
          .from("question_bank")
          .select("question_id, questions(*)")
          .eq("user_id", user.id);

        if (bankError) throw bankError;

        const questionBank: Question[] = (bankData || [])
          .filter(b => b.questions)
          .map(b => ({
            id: (b.questions as any).id,
            text: (b.questions as any).text,
            options: (b.questions as any).options,
            correctOptionId: (b.questions as any).correct_option_id,
            deckId: (b.questions as any).deck_id
          }));

        dispatch({ type: "SET_QUESTION_BANK", payload: questionBank });
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error loading data",
          description: "Failed to load your decks and questions.",
          variant: "destructive",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadData();
  }, [user]);

  // Helper functions
  const getDeckById = (id: string) => {
    return state.decks.find((deck) => deck.id === id);
  };

  const getSubdecks = (parentId: string | null) => {
    return getSubdecksUtil(state.decks, parentId);
  };

  const getQuestionsForDeck = (deckId: string) => {
    return getDeckQuestions(state.questions, deckId);
  };

  const getAllQuestionsForDeck = (deckId: string): Question[] => {
    return getAllQuestionsUtil(state.questions, state.decks, deckId);
  };
  
  const getTotalQuestionsCount = (deckId: string): number => {
    return getAllQuestionsForDeck(deckId).length;
  };

  const getStudyStats = () => {
    if (!state.currentSession) {
      return { total: 0, correct: 0, incorrect: 0 };
    }

    const { answeredQuestions, incorrectQuestions } = state.currentSession;
    const total = Object.keys(answeredQuestions).length;
    const incorrect = incorrectQuestions.length;
    const correct = total - incorrect;

    return { total, correct, incorrect };
  };
  
  const isQuestionInBank = (questionId: string): boolean => {
    return state.questionBank.some(q => q.id === questionId);
  };

  const startStudySession = async (deckId: string) => {
    const questions = getAllQuestionsForDeck(deckId);
    
    if (questions.length === 0) {
      toast({
        title: "No questions",
        description: "This deck has no questions to study.",
        variant: "destructive",
      });
      return;
    }
    
    // Get question attempts and sort by score (lowest first)
    const questionIds = questions.map(q => q.id);
    const attemptsByQuestion = await getQuestionAttempts(questionIds);
    const sortedQuestions = sortQuestionsByScore(questions, attemptsByQuestion);
    
    dispatch({
      type: "START_SESSION",
      payload: {
        deckId,
        currentQuestionIndex: 0,
        questions: sortedQuestions,
        incorrectQuestions: [],
        answeredQuestions: {},
      },
    });
  };

  const answerQuestion = (questionId: string, selectedOptionId: string) => {
    dispatch({
      type: "ANSWER_QUESTION",
      payload: { questionId, selectedOptionId },
    });
  };

  const nextQuestion = () => {
    dispatch({ type: "NEXT_QUESTION" });
  };

  const endStudySession = () => {
    dispatch({ type: "END_SESSION" });
  };

  const exportDeck = (deckId: string) => {
    const deck = getDeckById(deckId);
    if (!deck) return;

    const questions = getQuestionsForDeck(deckId);
    const subdecks = getSubdecks(deckId);
    
    let allSubdeckQuestions: Question[] = [];
    let allSubdecks: Deck[] = [];
    
    const getAllSubdecksAndQuestions = (parentId: string) => {
      const childDecks = getSubdecks(parentId);
      allSubdecks = [...allSubdecks, ...childDecks];
      
      childDecks.forEach(childDeck => {
        const childQuestions = getQuestionsForDeck(childDeck.id);
        allSubdeckQuestions = [...allSubdeckQuestions, ...childQuestions];
        getAllSubdecksAndQuestions(childDeck.id);
      });
    };
    
    getAllSubdecksAndQuestions(deckId);
    
    const { dataUri, exportFileDefaultName } = createExportData(
      deck, 
      allSubdecks, 
      [...questions, ...allSubdeckQuestions]
    );
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export successful",
      description: `Deck "${deck.title}" has been exported.`,
    });
  };

  const importDeck = async (deckData: string) => {
    try {
      const parsed = JSON.parse(deckData);
      
      if (!parsed.deck || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid deck data format");
      }
      
      const idMap = new Map<string, string>();
      
      const newDeck = {
        ...parsed.deck,
        id: crypto.randomUUID(),
      };
      idMap.set(parsed.deck.id, newDeck.id);
      
      dispatch({ type: "ADD_DECK", payload: newDeck });
      
      // Sync main deck to Supabase
      if (user) {
        await supabase.from("decks").insert({
          id: newDeck.id,
          user_id: user.id,
          title: newDeck.title,
          description: newDeck.description || null,
          parent_id: newDeck.parentId,
          is_subdeck: newDeck.isSubdeck,
          available_for_practice_test: parsed.deck.availableForPracticeTest || false,
        });
      }
      
      if (Array.isArray(parsed.subdecks)) {
        for (const subdeck of parsed.subdecks) {
          const newId = crypto.randomUUID();
          idMap.set(subdeck.id, newId);
          
          const newSubdeck = {
            ...subdeck,
            id: newId,
            parentId: subdeck.parentId ? idMap.get(subdeck.parentId) || null : null,
          };
          
          dispatch({ type: "ADD_DECK", payload: newSubdeck });
          
          // Sync subdeck to Supabase
          if (user) {
            await supabase.from("decks").insert({
              id: newSubdeck.id,
              user_id: user.id,
              title: newSubdeck.title,
              description: newSubdeck.description || null,
              parent_id: newSubdeck.parentId,
              is_subdeck: newSubdeck.isSubdeck,
              available_for_practice_test: subdeck.availableForPracticeTest || false,
            });
          }
        }
      }
      
      for (const question of parsed.questions) {
        const newQuestionId = crypto.randomUUID();
        const optionIdMap = new Map<string, string>();
        
        const newOptions = question.options.map(option => {
          const newOptionId = crypto.randomUUID();
          optionIdMap.set(option.id, newOptionId);
          return { ...option, id: newOptionId };
        });
        
        const newQuestion = {
          ...question,
          id: newQuestionId,
          deckId: idMap.get(question.deckId) || newDeck.id,
          options: newOptions,
          correctOptionId: optionIdMap.get(question.correctOptionId) || newOptions[0].id,
        };
        
        dispatch({ type: "ADD_QUESTION", payload: newQuestion });
        
        // Sync question to Supabase
        if (user) {
          await supabase.from("questions").insert({
            id: newQuestion.id,
            deck_id: newQuestion.deckId,
            text: newQuestion.text,
            options: newQuestion.options,
            correct_option_id: newQuestion.correctOptionId,
          });
        }
      }
      
      toast({
        title: "Import successful",
        description: `Deck "${newDeck.title}" has been imported.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "The deck data is invalid or corrupted.",
        variant: "destructive",
      });
    }
  };

  const contextValue: StudyContextType = {
    state,
    dispatch,
    getDeckById,
    getSubdecks,
    getQuestionsForDeck,
    getAllQuestionsForDeck,
    getTotalQuestionsCount,
    getStudyStats,
    startStudySession,
    answerQuestion,
    nextQuestion,
    endStudySession,
    exportDeck,
    importDeck,
    isQuestionInBank,
  };

  return (
    <StudyContext.Provider value={contextValue}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
};
