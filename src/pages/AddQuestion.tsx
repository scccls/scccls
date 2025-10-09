
import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useStudy } from "@/contexts/StudyContext";
import QuestionForm from "@/components/QuestionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";

const AddQuestionPage = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { dispatch, getDeckById } = useStudy();
  const { syncQuestion } = useSupabaseSync(dispatch);

  if (!deckId) {
    return <div>Invalid deck ID</div>;
  }

  const deck = getDeckById(deckId);

  if (!deck) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Deck not found</h2>
        <p className="text-muted-foreground mb-6">
          The deck you're trying to add a question to doesn't exist.
        </p>
        <Button asChild>
          <Link to="/">Back to All Decks</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    const newQuestion = {
      id: crypto.randomUUID(),
      text: data.text,
      options: data.options,
      correctOptionId: data.correctOptionId,
      deckId: deckId,
    };

    dispatch({ type: "ADD_QUESTION", payload: newQuestion });
    await syncQuestion(newQuestion);
    
    toast({
      title: "Question added",
      description: "Your question has been added successfully.",
    });
    
    navigate(`/deck/${deckId}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Add Question to {deck.title}</h1>
        <p className="text-muted-foreground mt-1">
          Create a multiple-choice question for this deck.
        </p>
      </div>

      <QuestionForm onSubmit={handleSubmit} />
    </div>
  );
};

export default AddQuestionPage;
