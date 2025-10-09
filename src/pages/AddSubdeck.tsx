
import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useStudy } from "@/contexts/StudyContext";
import DeckForm from "@/components/DeckForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";

const AddSubdeckPage = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { dispatch, getDeckById } = useStudy();
  const { syncDeck } = useSupabaseSync(dispatch);

  if (!deckId) {
    return <div>Invalid deck ID</div>;
  }

  const parentDeck = getDeckById(deckId);

  if (!parentDeck) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Parent deck not found</h2>
        <p className="text-muted-foreground mb-6">
          The parent deck you're trying to add a subdeck to doesn't exist.
        </p>
        <Button asChild>
          <Link to="/">Back to All Decks</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (data: { title: string; description?: string }) => {
    const newDeck = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description || "",
      parentId: deckId,
      isSubdeck: true,
    };

    dispatch({ type: "ADD_DECK", payload: newDeck });
    await syncDeck(newDeck);
    
    toast({
      title: "Subdeck created",
      description: `"${data.title}" has been added to "${parentDeck.title}".`,
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
        <h1 className="text-2xl font-bold">Add Subdeck to {parentDeck.title}</h1>
        <p className="text-muted-foreground mt-1">
          Create a new subdeck to further organize your study materials.
        </p>
      </div>

      <DeckForm onSubmit={handleSubmit} />
    </div>
  );
};

export default AddSubdeckPage;
