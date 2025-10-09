
import React, { useState } from "react";
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
import { FolderPlus } from "lucide-react";
import { Deck } from "@/types/StudyTypes";
import { TextImportDialog } from "@/components/TextImportDialog";

const IndexPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, getSubdecks, getQuestionsForDeck, dispatch } = useStudy();
  const { deleteDeck } = useSupabaseSync(dispatch);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

  // Get top-level decks (those without a parent)
  const topLevelDecks = getSubdecks(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Study Decks</h1>
        {user && (
          <div className="flex gap-2">
            <TextImportDialog />
            <Button onClick={handleAddDeck}>
              <FolderPlus className="mr-2 h-4 w-4" /> 
              Create Deck
            </Button>
          </div>
        )}
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
          {topLevelDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={handleEditDeck}
              onDelete={handleDeleteDeck}
              numQuestions={getQuestionsForDeck(deck.id).length}
              numSubdecks={getSubdecks(deck.id).length}
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
