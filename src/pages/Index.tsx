
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
import { getQuestionAttempts } from "@/utils/questionScoring";
import { calculateDeckMetrics, DeckMetrics } from "@/utils/deckMetrics";

const IndexPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, getSubdecks, getAllQuestionsForDeck, dispatch, getDeckById } = useStudy();
  const { deleteDeck, syncDeck } = useSupabaseSync(dispatch);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [deckMetrics, setDeckMetrics] = useState<Map<string, DeckMetrics>>(new Map());

  // Get top-level decks (those without a parent)
  const rawTopLevelDecks = getSubdecks(null);

  // Calculate metrics for all decks
  useEffect(() => {
    const calculateMetrics = async () => {
      const metrics = new Map<string, DeckMetrics>();
      
      for (const deck of rawTopLevelDecks) {
        const allQuestions = getAllQuestionsForDeck(deck.id);
        const questionIds = allQuestions.map(q => q.id);
        const attemptsByQuestion = await getQuestionAttempts(questionIds);
        const deckMetric = calculateDeckMetrics(allQuestions, attemptsByQuestion);
        metrics.set(deck.id, deckMetric);
      }
      
      setDeckMetrics(metrics);
    };

    if (user && rawTopLevelDecks.length > 0) {
      calculateMetrics();
    }
  }, [rawTopLevelDecks.length, user]);

  // Sort decks based on selected criteria
  const topLevelDecks = [...rawTopLevelDecks].sort((a, b) => {
    const metricsA = deckMetrics.get(a.id);
    const metricsB = deckMetrics.get(b.id);

    switch (sortBy) {
      case "name":
        return a.title.localeCompare(b.title);
      case "score-low":
        return (metricsA?.averageScore || 0) - (metricsB?.averageScore || 0);
      case "accuracy-low":
        return (metricsA?.accuracy || 0) - (metricsB?.accuracy || 0);
      case "completion-low":
        return (metricsA?.completion || 0) - (metricsB?.completion || 0);
      case "mastery-low":
        return (metricsA?.mastery || 0) - (metricsB?.mastery || 0);
      default:
        return 0;
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
          {user && topLevelDecks.length > 0 && (
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="score-low">Score: Low to High</SelectItem>
                <SelectItem value="accuracy-low">Accuracy: Low to High</SelectItem>
                <SelectItem value="completion-low">Completion: Low to High</SelectItem>
                <SelectItem value="mastery-low">Mastery: Low to High</SelectItem>
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
          <h2 className="text-xl font-medium mb-4">Welcome to SCC CLS Website!</h2>
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
          {topLevelDecks.map((deck) => {
            const metrics = deckMetrics.get(deck.id);
            return (
              <DeckCard
                key={deck.id}
                deck={deck}
                onEdit={handleEditDeck}
                onDelete={handleDeleteDeck}
                onDrop={handleDeckDrop}
                numQuestions={getAllQuestionsForDeck(deck.id).length}
                numSubdecks={getSubdecks(deck.id).length}
                averageScore={metrics?.averageScore}
              />
            );
          })}
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
