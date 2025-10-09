
import React from "react";
import { useNavigate } from "react-router-dom";
import { useStudy } from "@/contexts/StudyContext";
import DeckForm from "@/components/DeckForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";

const AddDeckPage = () => {
  const navigate = useNavigate();
  const { dispatch } = useStudy();
  const { syncDeck } = useSupabaseSync(dispatch);

  const handleSubmit = async (data: { title: string; description?: string }) => {
    const newDeck = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description || "",
      parentId: null,
      isSubdeck: false,
    };

    dispatch({ type: "ADD_DECK", payload: newDeck });
    await syncDeck(newDeck);
    
    toast({
      title: "Deck created",
      description: `"${data.title}" has been created successfully.`,
    });
    
    navigate(`/deck/${newDeck.id}`);
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
        <h1 className="text-2xl font-bold">Create a New Study Deck</h1>
        <p className="text-muted-foreground mt-1">
          Create a top-level deck to organize your study materials.
        </p>
      </div>

      <DeckForm onSubmit={handleSubmit} />
    </div>
  );
};

export default AddDeckPage;
