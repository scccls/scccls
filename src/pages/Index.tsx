
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStudy } from "@/contexts/StudyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import DeckCard from "@/components/DeckCard";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderPlus } from "lucide-react";
import { Deck } from "@/types/StudyTypes";
import { getQuestionAttempts, calculateQuestionScore } from "@/utils/questionScoring";
import { getAllQuestionsForDeck } from "@/utils/studyUtils";

const IndexPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, getSubdecks, getQuestionsForDeck, dispatch, getDeckById } = useStudy();
  const { deleteDeck, syncDeck } = useSupabaseSync(dispatch);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "score-low" | "score-high">("name");
  const [deckScores, setDeckScores] = useState<Map<string, number>>(new Map());

  // Get top-level decks (those without a parent)
  const topLevelDecks = getSubdecks(null);

  // Calculate average scores for all decks
  useEffect(() => {
    const calculateScores = async () => {
      const scores = new Map<string, number>();
      
      for (const deck of topLevelDecks) {
        const allQuestions = getAllQuestionsForDeck(state.questions, state.decks, deck.id);
        
        if (allQuestions.length === 0) {
          scores.set(deck.id, 0);
          continue;
        }

        const questionIds = allQuestions.map(q => q.id);
        const attemptsByQuestion = await getQuestionAttempts(questionIds);
        
        let totalScore = 0;
        for (const question of allQuestions) {
          const attempts = attemptsByQuestion.get(question.id) || [];
          totalScore += calculateQuestionScore(attempts);
        }
        
        const averageScore = totalScore / allQuestions.length;
        scores.set(deck.id, averageScore);
      }
      
      setDeckScores(scores);
    };

    if (topLevelDecks.length > 0) {
      calculateScores();
    }
  }, [topLevelDecks, state.questions, state.decks]);

  // Sort decks based on selected option
  const sortedDecks = [...topLevelDecks].sort((a, b) => {
    if (sortBy === "name") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "score-low") {
      const scoreA = deckScores.get(a.id) || 0;
      const scoreB = deckScores.get(b.id) || 0;
      return scoreA - scoreB;
    } else {
      const scoreA = deckScores.get(a.id) || 0;
      const scoreB = deckScores.get(b.id) || 0;
      return scoreB - scoreA;
    }
  });

  const handleAddDeck = () => {
    navigate("/add-deck");
  };

  const handleEditDeck = (deck: Deck) => {
    navigate(`/deck/${deck.id}/edit`);
  };

  const handleDeleteDeck = (deck: Deck, event?: React.MouseEvent) => {
    // Prevent event propagation to parent elements
    if (event) {
      event.stopPropagation();
    }
    setDeckToDelete(deck);
  };

  const confirmDeleteDeck = async () => {
    if (deckToDelete) {
      dispatch({ type: "DELETE_DECK", payload: deckToDelete.id });
      await deleteDeck(deckToDelete.id);
      setDeckToDelete(null);
    }
  };

  const handleDeckDrop = async (droppedDeckId: string, targetDeckId: string) => {
    const droppedDeck = getDeckById(droppedDeckId);
    const targetDeck = getDeckById(targetDeckId);
    
    if (!droppedDeck || !targetDeck) return;
    
    // Don't allow a deck to become a subdeck of one of its own subdecks
    const isTargetSubdeckOfDropped = (checkDeckId: string, potentialParentId: string): boolean => {
      const deck = getDeckById(checkDeckId);
      if (!deck || !deck.parentId) return false;
      if (deck.parentId === potentialParentId) return true;
      return isTargetSubdeckOfDropped(deck.parentId, potentialParentId);
    };
    
    if (isTargetSubdeckOfDropped(targetDeckId, droppedDeckId)) {
      return;
    }
    
    const updatedDeck: Deck = {
      ...droppedDeck,
      parentId: targetDeckId,
      isSubdeck: true,
    };
    
    dispatch({ type: "UPDATE_DECK", payload: updatedDeck });
    await syncDeck(updatedDeck);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Study Decks</h1>
        <div className="flex items-center gap-3">
          {topLevelDecks.length > 0 && (
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="score-low">Score: Low to High</SelectItem>
                <SelectItem value="score-high">Score: High to Low</SelectItem>
              </SelectContent>
            </Select>
          )}
          {user && (
            <Button onClick={handleAddDeck}>
              <FolderPlus className="mr-2 h-4 w-4" /> 
              Create Deck
            </Button>
          )}
        </div>
      </div>

      {!user ? (
        <div className="py-12 text-center">
          <h2 className="text-xl font-medium mb-4">Welcome to SCC CLS Platform!</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to create study decks, organize materials, and practice questions across all your devices.
          </p>
          <Link to="/auth">
            <Button>Sign In to Get Started</Button>
          </Link>
        </div>
      ) : topLevelDecks.length === 0 ? (
        <div className="py-12 text-center">
          <h2 className="text-xl font-medium mb-4">Create Your First Deck!</h2>
          <p className="text-muted-foreground mb-6">
            Create your first study deck to get started. You can organize your study materials 
            into decks and subdecks, add multiple-choice questions, and practice them.
          </p>
          <Button onClick={handleAddDeck}>
            <FolderPlus className="mr-2 h-4 w-4" /> 
            Create Your First Deck
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={handleEditDeck}
              onDelete={handleDeleteDeck}
              onDrop={handleDeckDrop}
              numQuestions={getQuestionsForDeck(deck.id).length}
              numSubdecks={getSubdecks(deck.id).length}
              averageScore={deckScores.get(deck.id) || 0}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deckToDelete} onOpenChange={(open) => !open && setDeckToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deck</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deckToDelete?.title}</strong>? 
              This will also delete all questions and subdecks within it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDeck} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IndexPage;
