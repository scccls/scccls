
import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useStudy } from "@/contexts/StudyContext";
import QuestionForm from "@/components/QuestionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";

const EditQuestionPage = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useStudy();
  const { syncQuestion } = useSupabaseSync(dispatch);

  if (!questionId) {
    return <div>Invalid question ID</div>;
  }

  const question = state.questions.find((q) => q.id === questionId);

  if (!question) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Question not found</h2>
        <p className="text-muted-foreground mb-6">
          The question you're trying to edit doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link to="/">Back to All Decks</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    const updatedQuestion = {
      ...question,
      text: data.text,
      options: data.options,
      correctOptionId: data.correctOptionId,
    };

    dispatch({ type: "UPDATE_QUESTION", payload: updatedQuestion });
    await syncQuestion(updatedQuestion);
    
    toast({
      title: "Question updated",
      description: "Your question has been updated successfully.",
    });
    
    navigate(`/deck/${question.deckId}`);
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
        <h1 className="text-2xl font-bold">Edit Question</h1>
        <p className="text-muted-foreground mt-1">
          Update your multiple-choice question.
        </p>
      </div>

      <QuestionForm
        onSubmit={handleSubmit}
        defaultValues={question}
        isEdit
      />
    </div>
  );
};

export default EditQuestionPage;
