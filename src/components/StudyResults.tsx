
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface StudyResultsProps {
  total: number;
  correct: number;
  incorrect: number;
  deckId: string;
  onRestart: () => void;
  hideBackButton?: boolean;
}

const StudyResults: React.FC<StudyResultsProps> = ({
  total,
  correct,
  incorrect,
  deckId,
  onRestart,
  hideBackButton = false,
}) => {
  const navigate = useNavigate();
  
  // Ensure all numbers are non-negative for calculations
  const safeTotal = Math.max(0, total);
  const safeCorrect = Math.max(0, correct);
  const safeIncorrect = Math.max(0, incorrect);
  
  // Calculate percentage, ensuring it's between 0 and 100
  const percentage = safeTotal > 0 
    ? Math.min(100, Math.max(0, Math.round((safeCorrect / safeTotal) * 100))) 
    : 0;

  const handleBackClick = () => {
    // If we have a deckId, navigate to that deck, otherwise go to question bank
    if (deckId) {
      navigate(`/deck/${deckId}`);
    } else {
      navigate("/question-bank");
    }
  };

  return (
    <div className="text-center py-8 space-y-6">
      <h2 className="text-2xl font-bold">Session Review</h2>

      <div className="flex justify-center space-x-8 my-8">
        <div className="text-center">
          <div className="text-4xl font-bold">{safeTotal}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-green-500">{safeCorrect}</div>
          <div className="text-sm text-muted-foreground">Correct</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-red-500">{safeIncorrect}</div>
          <div className="text-sm text-muted-foreground">Incorrect</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-500">{percentage}%</div>
          <div className="text-sm text-muted-foreground">Score</div>
        </div>
      </div>

      <div className="space-y-3">
        {safeIncorrect > 0 ? (
          <p>You got {safeIncorrect} questions wrong.</p>
        ) : (
          <p>Perfect score! You got all questions correct.</p>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {!hideBackButton && (
            <Button onClick={handleBackClick}>
              {deckId ? "Back to Deck" : "Back to Question Bank"}
            </Button>
          )}

          <Button variant="outline" onClick={onRestart}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Restart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudyResults;
