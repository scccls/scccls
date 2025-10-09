import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Deck, Question, StudyAction } from "@/types/StudyTypes";
import { useAuth } from "@/contexts/AuthContext";

export const useSupabaseSync = (
  dispatch: React.Dispatch<StudyAction>
) => {
  const { user } = useAuth();

  const syncDeck = async (deck: Deck) => {
    if (!user) return;

    const { error } = await supabase
      .from("decks")
      .upsert({
        id: deck.id,
        user_id: user.id,
        title: deck.title,
        description: deck.description || null,
        parent_id: deck.parentId,
        is_subdeck: deck.isSubdeck,
      });

    if (error) {
      console.error("Error syncing deck:", error);
    }
  };

  const deleteDeck = async (deckId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("decks")
      .delete()
      .eq("id", deckId);

    if (error) {
      console.error("Error deleting deck:", error);
    }
  };

  const syncQuestion = async (question: Question) => {
    if (!user) return;

    const { error } = await supabase
      .from("questions")
      .upsert({
        id: question.id,
        deck_id: question.deckId,
        text: question.text,
        options: question.options,
        correct_option_id: question.correctOptionId,
      });

    if (error) {
      console.error("Error syncing question:", error);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      console.error("Error deleting question:", error);
    }
  };

  const addToQuestionBank = async (questionId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("question_bank")
      .upsert({
        user_id: user.id,
        question_id: questionId,
      });

    if (error) {
      console.error("Error adding to question bank:", error);
    }
  };

  const removeFromQuestionBank = async (questionId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("question_bank")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId);

    if (error) {
      console.error("Error removing from question bank:", error);
    }
  };

  return {
    syncDeck,
    deleteDeck,
    syncQuestion,
    deleteQuestion,
    addToQuestionBank,
    removeFromQuestionBank,
  };
};
