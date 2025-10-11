
import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useStudy } from "@/contexts/StudyContext";
import DeckForm from "@/components/DeckForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";

const EditDeckPage = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { dispatch, getDeckById } = useStudy();
  const { syncDeck } = useSupabaseSync(dispatch);

  if (!deckId) {
    return <div>Invalid deck ID</div>;
  }

  const deck = getDeckById(deckId);

  if (!deck) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Deck not found</h2>
        <p className="text-muted-foreground mb-6">
          The deck you're trying to edit doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link to="/">Back to All Decks</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (data: { title: string; description?: string; availableForPracticeTest?: boolean }) => {
    const updatedDeck = {
      ...deck,
      title: data.title,
      description: data.description || "",
      availableForPracticeTest: data.availableForPracticeTest ?? deck.availableForPracticeTest ?? false,
    };

    dispatch({ type: "UPDATE_DECK", payload: updatedDeck });
    await syncDeck(updatedDeck);
    
    toast({
      title: "Deck updated",
      description: `"${data.title}" has been updated successfully.`,
    });
    
    navigate(`/deck/${deckId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Deck</h1>
        <p className="text-muted-foreground mt-1">
          Update the details of your deck.
        </p>
      </div>

      <DeckForm
        onSubmit={handleSubmit}
        defaultValues={{
          title: deck.title,
          description: deck.description,
          availableForPracticeTest: deck.availableForPracticeTest ?? false,
        }}
        isEdit
      />
    </div>
  );
};

export default EditDeckPage;
