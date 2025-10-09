import React from "react";
import { Question } from "@/types/StudyTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QuestionAttempt } from "@/utils/questionScoring";

interface QuestionCardProps {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  showActions?: boolean;
  score?: number;
  attempts?: QuestionAttempt[];
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onEdit,
  onDelete,
  showActions = true,
  score,
  attempts = [],
}) => {
  // Get last 3 attempts for display
  const last3Attempts = attempts.slice(0, 3);
  
  // Fill remaining slots with null (unattempted)
  const attemptsDisplay = [
    ...last3Attempts.map(a => a.is_correct),
    ...Array(3 - last3Attempts.length).fill(null)
  ];
  return (
    <Card className="question-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{question.text}</CardTitle>
          {showActions && (
            <div className="flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Question score"
                    >
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Score: {typeof score === "number" ? score.toFixed(2) : "0.00"}
                      </div>
                      <div className="flex gap-2 justify-center">
                        {attemptsDisplay.map((isCorrect, idx) => (
                          <div
                            key={idx}
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: 
                                isCorrect === null 
                                  ? "hsl(var(--muted))" 
                                  : isCorrect 
                                  ? "hsl(142, 76%, 36%)" 
                                  : "hsl(0, 84%, 60%)"
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(question)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(question.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mt-2">
          {question.options.map((option) => (
            <div
              key={option.id}
              className={`p-2 border rounded-md ${
                option.id === question.correctOptionId
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              {option.text}
              {option.id === question.correctOptionId && (
                <span className="ml-2 text-green-500 text-sm font-medium">
                  (Correct)
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
